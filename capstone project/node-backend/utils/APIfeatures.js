const { Op } = require("sequelize");
const { User, Agent } = require("../models/index.sql");

class APIFeatures {
  constructor(model, queryString) {
    this.model = model;
    this.queryString = queryString;
    this.whereClause = {};
    this.orderBy = [];
    this.attributes = null;
    this.offset = 0;
    this.limit = 10;
    this.include = [];
  }

  _isTrue(val) {
    return val === "true" || val === true;
  }

  search() {
    const { search } = this.queryString;
    if (!search) return this;

    const cleanSearch = search.trim();
    const searchPattern = `%${cleanSearch}%`;

    // 1. DYNAMIC SEARCH: Shipment Model
    if (this.model.name === 'Shipment') {
      this.whereClause[Op.or] = [
        { shipment_code: { [Op.like]: searchPattern } },
        { pickup_city: { [Op.like]: searchPattern } },
        { pickup_subregion: { [Op.like]: searchPattern } },
        { delivery_city: { [Op.like]: searchPattern } },
        { delivery_subregion: { [Op.like]: searchPattern } },
        { delay_reason: { [Op.like]: searchPattern } },
        { "$User.full_name$": { [Op.like]: searchPattern } },
        { "$Agent.name$": { [Op.like]: searchPattern } }
      ];

      this.orderBy.unshift([
        this.model.sequelize.literal(`
        (CASE 
          WHEN shipment_code = ${this.model.sequelize.escape(cleanSearch)} THEN 1
          WHEN delivery_city = ${this.model.sequelize.escape(cleanSearch)} THEN 2
          ELSE 3
        END)`),
        "ASC",
      ]);
    }

    // 2. DYNAMIC SEARCH: Agent Model
    else if (this.model.name === 'Agent') {
      this.whereClause[Op.or] = [
        { name: { [Op.like]: searchPattern } },
        { email: { [Op.like]: searchPattern } },
        { phone: { [Op.like]: searchPattern } },
        { city: { [Op.like]: searchPattern } },
        { subregion: { [Op.like]: searchPattern } }
      ];

      this.orderBy.unshift([
        this.model.sequelize.literal(`
        (CASE 
          WHEN name = ${this.model.sequelize.escape(cleanSearch)} THEN 1
          WHEN city = ${this.model.sequelize.escape(cleanSearch)} THEN 2
          ELSE 3
        END)`),
        "ASC",
      ]);
    }

    // 3. DYNAMIC SEARCH: Location Model
    else if (this.model.name === 'Location') {
      this.whereClause[Op.or] = [
        { city: { [Op.like]: searchPattern } },
        { subregion: { [Op.like]: searchPattern } }
      ];

      this.orderBy.unshift([
        this.model.sequelize.literal(`
        (CASE 
          WHEN city = ${this.model.sequelize.escape(cleanSearch)} THEN 1
          WHEN subregion = ${this.model.sequelize.escape(cleanSearch)} THEN 2
          ELSE 3
        END)`),
        "ASC",
      ]);
    }

    this._ensureAssociationsIncluded();
    return this;
  }

  filter() {
    this.whereClause = {};
    const queryObj = { ...this.queryString };
    
    // 1. Defensively exclude meta-parameters from the WHERE clause
    const excludeFields = ["page", "limit", "sort", "fields", "search", "includeDeleted", "is_deleted"];
    excludeFields.forEach((ele) => delete queryObj[ele]);

    const operatorMap = {
      gte: Op.gte, gt: Op.gt, lte: Op.lte, lt: Op.lt, ne: Op.ne,
    };

    // 2. Handle "Only Deleted" filtering explicitly
    if (this._isTrue(this.queryString.is_deleted)) {
      this.whereClause.deletedAt = { [Op.ne]: null };
    }

    // 3. Process remaining valid filters
    Object.keys(queryObj).forEach((key) => {
      let value = queryObj[key];
      // Skip empty/null values
      if (value === undefined || value === null || value === "") return;

      if (key === "is_delayed") {
        this.whereClause[key] = this._isTrue(value);
      } 
      else if (key === "user_id" || key === "agent_id") {
        this.whereClause[key] = value;
      }
      else if (key === "tags") {
        // 1. Normalize input (lowercase + underscores for spaces)
        const fuzzyTag = value.trim().replace(/\s+/g, "_").toLowerCase();
        
        // 2. Use a Sequelize where-clause with LOWER() for case-insensitive JSON string matching
        this.whereClause[Op.and] = this.whereClause[Op.and] || [];
        this.whereClause[Op.and].push(
          this.model.sequelize.where(
            this.model.sequelize.fn('LOWER', this.model.sequelize.col('tags')),
            { [Op.like]: `%${fuzzyTag}%` }
          )
        );
      }
      // 4. Handle nested objects (e.g. { weight_kg: { gte: '10' } }) 
      // This is the default behavior of the 'qs' library used by Express for bracket notation
      else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        this.whereClause[key] = this.whereClause[key] || {};
        Object.keys(value).forEach((subKey) => {
          if (operatorMap[subKey]) {
            // Numeric casting for comparison operators (gte, lte, etc.)
            const numericVal = (!isNaN(value[subKey]) && value[subKey].trim() !== "") 
              ? Number(value[subKey]) 
              : value[subKey];
            this.whereClause[key][operatorMap[subKey]] = numericVal;
          } else {
            this.whereClause[key][subKey] = value[subKey];
          }
        });
      }
      // 5. Handle flat string keys with brackets (e.g. "weight_kg[gte]")
      else if (key.includes("[") && key.includes("]")) {
        const field = key.substring(0, key.indexOf("["));
        const operator = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
        if (operatorMap[operator]) {
          this.whereClause[field] = this.whereClause[field] || {};
          const numericVal = (!isNaN(value) && value.trim() !== "") ? Number(value) : value;
          this.whereClause[field][operatorMap[operator]] = numericVal;
        }
      } 
      else {
        this.whereClause[key] = value;
      }
    });

    this._ensureAssociationsIncluded();
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.orderBy = this.queryString.sort.split(",").map((s) => {
        const field = s.trim();
        const isDesc = field.startsWith("-");
        const actualField = isDesc ? field.substring(1) : field;
        return isDesc ? [actualField, "DESC"] : [actualField, "ASC"];
      });
    } else {
      if (this.model.name === 'Shipment') {
        this.orderBy.push(["is_delayed", "DESC"]);
      }
      // Added fallback sort for Locations to make the modal clean by default
      else if (this.model.name === 'Location') {
        this.orderBy.push(["city", "ASC"]);
        this.orderBy.push(["subregion", "ASC"]);
        return this;
      }
      this.orderBy.push(["createdAt", "DESC"]);
    }
    return this;
  }

  _ensureAssociationsIncluded() {
    if (this.model.name === 'Shipment') {
      if (!this.include.find((inc) => inc.model === User)) {
        this.include.push({ model: User, attributes: ["full_name", "email"] });
      }
      if (!this.include.find((inc) => inc.model === Agent)) {
        this.include.push({ model: Agent, attributes: ["name", "phone", "subregion"] });
      }
    }
  }

  limitFields() {
    if (this.queryString.fields) {
      this.attributes = this.queryString.fields.split(",").map((f) => f.trim());
    } else {
      const exclude = ["updatedAt"];
      // Show deletedAt only when explicitly requested
      if (!this._isTrue(this.queryString.includeDeleted)) {
        exclude.push("deletedAt");
      }
      this.attributes = { exclude };
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    // Default limit remains 100, which is perfect for fetching a list of locations for a dropdown
    const limit = this.queryString.limit * 1 || 100;
    this.limit = limit;
    this.offset = (page - 1) * limit;
    return this;
  }

  async execute(additionalOptions = {}) {
    const finalInclude = [...this.include];
    if (additionalOptions.include) {
      additionalOptions.include.forEach(newInc => {
        if (!finalInclude.find(existing => existing.model === newInc.model)) {
          finalInclude.push(newInc);
        }
      });
    }

    const { count, rows } = await this.model.findAndCountAll({
      where: this.whereClause,
      order: this.orderBy,
      attributes: this.attributes,
      limit: this.limit,
      offset: this.offset,
      include: finalInclude,
      distinct: true,
      paranoid: !this._isTrue(this.queryString.includeDeleted)
    });
    return { results: count, data: rows };
  }
}

module.exports = APIFeatures;