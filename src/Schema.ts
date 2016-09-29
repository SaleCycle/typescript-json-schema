import {Property} from './Property';

export class Schema {
    private name: string;
    private rawSchema: any;
    private requiredProps: Array<string>;
    private hiddenProps: Array<Property>;

    constructor(name: string, schema: any) {
        this.name = name;
        this.rawSchema = schema;

        this.validate();

        this.requiredProps = this.rawSchema.required || [];

        // if we have properties, map them to be property objects
        if (this.hasProperties()) {
            this.hiddenProps = Object.keys(this.rawSchema.properties).map(key => new Property(key, this.rawSchema.properties[key], this.id));
        }
    }

    allowsAdditionalProperties(): boolean {
        // this looks a bit weird, but it's so the default is true if we don't specify
        return this.rawSchema.additionalProperties === false ? false : true;
    }

    get dependencies(): Array<string> {
        if (!this.hasProperties()) {
            return [];
        }

        return this.properties.map(prop => prop.ref)
            .filter(ref => !!ref);
    }

    get outputFileName(): string {
        return this.title;
    }

    get id(): string {
        return this.rawSchema.id;
    }

    get properties(): Array<Property> {
        return this.hiddenProps || [];
    }

    get title(): string {
        return this.rawSchema.title;
    }

    get type(): string {
        return this.rawSchema.type;
    }

    get numProperties(): number {
        return this.rawSchema.properties ? Object.keys(this.rawSchema.properties).length : 0;
    }

    hasProperties(): boolean {
        return this.numProperties > 0;
    }

    isPropertyRequired(key): boolean {
        return this.requiredProps.includes(key);
    }

    toProperty(): Property {
        return new Property(this.title, this.rawSchema, this.id);
    }

    validate() {
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

        if (!this.rawSchema['$schema']) {
            throw new Error('Schema version must be specified');
        }

        if (this.rawSchema['$schema'] !== 'http://json-schema.org/draft-04/schema') {
            throw new Error('Only schema version "http://json-schema.org/draft-04/schema" is supported at this time');
        }
    }
}