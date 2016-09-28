/**
 * Created by steve.jenkins on 28/09/2016.
 */

const validTypes: Array<string> = ['array', 'boolean', 'integer', 'number', 'null', 'object', 'string'];

export class Property {
    private hiddenKey: string;
    private type: string;

    constructor(key: string, objProp: any) {
        this.hiddenKey = key;
        this.type = objProp.type;

        this.validate();
    }

    get key(): string {
        return this.hiddenKey;
    }

    get typescriptType(): string {
        // TODO arrays are special and have "items" property
        if (this.type === 'array') {
            return 'any';
        }

        // there is no TS type for int, only number
        if (this.type === 'integer') {
            return 'number';
        }

        // TODO object have nested objects
        if (this.type === 'object') {
            return 'any';
        }

        return this.type;
    }

    validate() {
        if (!this.key) {
            throw new Error('Property key must be supplied');
        }

        if (!this.type) {
            throw new Error('Property must have a type');
        }

        if (!validTypes.includes(this.type)) {
            throw new Error(`Unknown type ${this.type}. Type must be one of ${JSON.stringify(validTypes)}`);
        }
    }
}