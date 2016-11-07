// valid JSON schema types
const validTypes: Array<string> = ['array', 'boolean', 'integer', 'number', 'null', 'object', 'string'];

/**
 * Similar to what we do inside the class, except we handle objects slightly differently
 * and assume no nested arrays
 * @param initialType {string} the item type as it appears in the json schema
 * @returns {string} the typescript type
 */
function getItemType(initialType: string): string {
  if (!initialType) {
    return 'any';
  }

  switch (initialType) {
    case 'object':
      return 'any';
    case 'integer':
      return 'number';
    default:
      return initialType;
  }
}

/**
 * Parse an array's items object to work out what we're allowed inside the array
 * if the items allows anyOf/allOf/oneOf we create a TS type like Array<string|number|null>
 * otherwise we return the one type which is allowed e.g. Array<boolean>
 * (note the Array<> wrapper is not added at this point)
 * @param itemsProp {object} the items property from the JSON schema
 * @returns {string} the allowed TS type(s)
 */
function parseItems (itemsProp: any): string {
  if (!itemsProp) {
    return 'any';
  }
  // not much we can do here, we just have to tell TS to allow any of the values
  if (itemsProp.anyOf) {
    return itemsProp.anyOf.map((def: any) => getItemType(def.type)).join('|');
  } else if (itemsProp.allOf) {
    return itemsProp.allOf.map((def: any) => getItemType(def.type)).join('|');
  } else if (itemsProp.oneOf) {
    return itemsProp.oneOf.map((def: any) => getItemType(def.type)).join('|');
  }

  return getItemType(itemsProp.type);
}

export class Property {
  private parent: string;
  private hiddenKey: string;
  private hiddenType: string;
  private hiddenProps: Array<Property>;
  private requiredProperties: Array<string>;
  private hiddenArrayItemsType: string;
  private hiddenRef: string;

  /**
   * Create a new property instance
   * @param key {string} the key as defined in the parent schema/property
   * @param objProp {any} the raw property as defined in the JSON schema
   * @param parent {string} the id of the parent (used for logging only)
   */
  constructor(key: string, objProp: any, parent: string) {
    this.hiddenKey = key;
    this.hiddenType = objProp.type;
    this.hiddenRef = objProp.$ref;
    this.parent = parent;

    // check we have everything we need to proceed
    this.validate();

    // if the property is an object it will have child properties, map them to be property objects and pull out required fields
    if (this.hiddenType === 'object' && !!objProp.properties) {
      this.hiddenProps = Object.keys(objProp.properties).map(propKey => new Property(propKey, objProp.properties[propKey], this.key));
      this.requiredProperties = objProp.required || [];
    } else {
      this.hiddenProps = [];
      this.requiredProperties = [];
    }

    // if the property is of type array then get the list of acceptable things in the array
    if (this.hiddenType === 'array') {
      this.hiddenArrayItemsType = parseItems(objProp.items);
      this.hiddenRef = objProp.items.$ref;
    }
  }

  get dependencies(): Array<string> {
    const result: Array<string> = [];

    if (this.ref) {
      result.push(this.ref);
    }

    if (!this.hasProperties()) {
      return result;
    }

    this.properties.forEach(prop => {
      if (prop.ref) {
        result.push(prop.ref);
        return;
      }

      if (!prop.hasProperties()) {
        return;
      }

      console.log(prop.properties);
      result.push(...prop.dependencies);
    });

    return result;
  }

  /**
   * Get the key name for the current property (as defined on it's parent)
   * @returns {string} the key name as defined on the parent schema
   */
  get key(): string {
    return this.hiddenKey;
  }

  /**
   * Get the $ref id for the related schema
   * NOTE this property will only exist if the JSON schema specifies $ref as the property type
   * @returns {string}
   */
  get ref(): string {
    return this.hiddenRef;
  }

  /**
   * Get the array of property objects we have
   * NOTE this will only be filled if our type is "object"
   * @returns {Array<Property>} an array of child properties
   */
  get properties(): Array<Property> {
    return this.hiddenProps;
  }

  /**
   * Get the corresponding TypeScript type for the property
   * NOTE may return ___REFERENCE___ if it references another schema, or ___OBJECT___ if the property
   * is a child object
   * @returns {string} the TypeScript type for the property
   */
  get typescriptType(): string {
    // if we're a reference to another schema - return out
    if (this.hiddenRef) {
      return '___REFERENCE___';
    }

    // if we're of type array and we have an items array, make an array of specified types
    if (this.hiddenType === 'array') {
      return `Array<${this.hiddenArrayItemsType}>`;
    }

    // there is no TS type for int, only number
    if (this.hiddenType === 'integer') {
      return 'number';
    }

    // if we are an object and have child properties, create child object
    // otherwise if just type of object, then any is all we can do
    if (this.hiddenType === 'object' && this.hiddenProps.length > 0) {
      return '___OBJECT___';
    } else if (this.hiddenType === 'object') {
      return 'any';
    }

    // by default return the json schema defined type
    return this.hiddenType;
  }

  public hasProperties(): boolean {
    return !!this.properties && this.properties.length > 0;
  }

  public isArray(): boolean {
    return this.hiddenType === 'array';
  }
  /**
   * Is the child property required (true if required, else false)
   * @param key {string} the key to check for
   * @returns {boolean} true if the property is required, else false
   */
  public isPropertyRequired(key: string): boolean {
    return this.requiredProperties.includes(key);
  }

  /**
   * Validate that we have the fields we need and that the type is valid
   */
  private validate(): void {
    if (!this.key) {
      throw new Error('Property key must be supplied');
    }

    // if we have a reference - no need to validate type
    if (!!this.hiddenRef) {
      return;
    }

    if (!this.hiddenType && !this.hiddenRef) {
      throw new Error(`Property "${this.key}" in schema "${this.parent}" must have a type or reference another schema`);
    }

    if (!validTypes.includes(this.hiddenType)) {
      throw new Error(`Unknown type "${this.hiddenType}". Type must be one of ${JSON.stringify(validTypes)}`);
    }
  }
}
