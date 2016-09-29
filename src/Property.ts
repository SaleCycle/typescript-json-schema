/**
 * Created by steve.jenkins on 28/09/2016.
 */
const validTypes: Array<string> = ['array', 'boolean', 'integer', 'number', 'null', 'object', 'string'];

export class Property {
    private hiddenKey: string;
    private hiddenType: string;
    private hiddenProps: Array<Property>;
    private requiredProperties: Array<string>;

    constructor(key: string, objProp: any) {
        this.hiddenKey = key;
        this.hiddenType = objProp.type;

        this.validate();

        if (this.hiddenType === 'object') {
            this.hiddenProps = Object.keys(objProp.properties).map(propKey => new Property(propKey, objProp.properties[propKey]));
            this.requiredProperties = objProp.required;
        } else {
            this.hiddenProps = [];
            this.requiredProperties = [];
        }
    }

    get key(): string {
        return this.hiddenKey;
    }

    get properties(): Array<Property> {
        return this.hiddenProps;
    }

    get typescriptType(): string {
        // TODO arrays are special and have "items" property
        if (this.hiddenType === 'array') {
            return `Array<any>`;
            // TODO array items is an object and may have 1 type or multiple types
            // how to deal with multiple types?
        }

        // there is no TS type for int, only number
        if (this.hiddenType === 'integer') {
            return 'number';
        }

        if (this.hiddenType === 'object') {
            return '___OBJECT___';
        }

        return this.hiddenType;
    }

    isPropertyRequired(key): boolean {
        return this.requiredProperties.includes(key);
    }

    validate() {
        if (!this.key) {
            throw new Error('Property key must be supplied');
        }

        if (!this.hiddenType) {
            throw new Error('Property must have a type');
        }

        if (!validTypes.includes(this.hiddenType)) {
            throw new Error(`Unknown type "${this.hiddenType}". Type must be one of ${JSON.stringify(validTypes)}`);
        }
    }
}