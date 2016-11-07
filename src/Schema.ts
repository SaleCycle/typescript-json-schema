import {Property} from './Property';

export class Schema {
  private rawSchema: any;
  private requiredProps: Array<string>;
  private hiddenProps: Array<Property>;

  /**
   * Create a new schema instance
   * @param schema {any} the raw JSON schema object
   */
  constructor(schema: any) {
    this.rawSchema = schema;

    // validate we have everything we need
    this.validate();

    this.requiredProps = this.rawSchema.required || [];

    // if we have properties, map them to be property objects
    if (this.hasProperties()) {
      this.hiddenProps = Object.keys(this.rawSchema.properties).map(key => new Property(key, this.rawSchema.properties[key], this.id));
    }
  }

  /**
   * Get an array of the dependencies this schema.
   * Dependencies are picked from properties which have a $ref property
   * @returns {Array<string>} an array of dependencies
   */
  get dependencies(): Array<string> {
    if (!this.hasProperties()) {
      return [];
    }

    const deps: Array<string> = [];

    this.properties.forEach(prop => {
      deps.push(...prop.dependencies);
    });

    return deps;
  }

  /**
   * the name of the file we should output to
   * NOTE this does not include the file extension or the base path
   * @returns {string} the file name to write to
   */
  get outputFileName(): string {
    return this.title;
  }

  /**
   * Get the id of the schema as defined in the "id" property
   * @returns {string} the schema's id
   */
  get id(): string {
    return this.rawSchema.id;
  }

  /**
   * get an array off the properties defined in this schema
   * @returns {Array<Property>} an array of properties
   */
  get properties(): Array<Property> {
    return this.hiddenProps || [];
  }

  /**
   * Get the title of the schema as defined in the "title" property
   * @returns {string} the title of the schema
   */
  get title(): string {
    return this.rawSchema.title;
  }

  /**
   * Get the type of the schema as defined in the "type" property
   * @returns {string} the type of the schema (eg object|string)
   */
  get type(): string {
    return this.rawSchema.type;
  }

  /**
   * Get the number of properties the schemas has
   * @returns {number} the number of properties the schema has
   */
  get numProperties(): number {
    return this.rawSchema.properties ? Object.keys(this.rawSchema.properties).length : 0;
  }

  /**
   * Check if the schema has properties
   * @returns {boolean} true if we have at least 1 property, else false
   */
  public hasProperties(): boolean {
    return this.numProperties > 0;
  }

  /**
   * Check if a property on the schema is required (or optional)
   * @param key {string} the key to check
   * @returns {boolean} true if required, else false if optional
   */
  public isPropertyRequired(key: string): boolean {
    return this.requiredProps.includes(key);
  }

  /**
   * Convert the schema to a property, this is useful if the schema type is not object and needs to
   * be written into another interface
   * @returns {Property} the schema as a property
   */
  public toProperty(): Property {
    return new Property(this.title, this.rawSchema, this.id);
  }

  /**
   * Validate that we have all the things we need to be able to create an interface
   */
  private validate() {
    if (!this.rawSchema || typeof this.rawSchema !== 'object' || Array.isArray(this.rawSchema)) {
      throw new Error('passed schema must be a JSON object');
    }

    if (!this.id) {
      throw new Error('Schema must have an "id" property');
    }

    if (!this.type) {
      throw new Error('Schema must have a "type" property');
    }

    if (!this.title) {
      throw new Error('Schema must have a "title" property');
    }

    if (!this.rawSchema.$schema) {
      throw new Error('Schema version must be specified');
    }

    if (this.rawSchema.$schema !== 'http://json-schema.org/draft-04/schema') {
      throw new Error('Only schema version "http://json-schema.org/draft-04/schema" is supported at this time');
    }
  }
}
