/**
 * Created by steve.jenkins on 28/09/2016.
 */
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
    // not much we can do here, we just have to tell TS to allow any of the values
    if(itemsProp.anyOf) {
        return itemsProp.anyOf.map(def => getItemType(def.type)).join('|');
    } else if (itemsProp.allOf) {
        return itemsProp.allOf.map(def => getItemType(def.type)).join('|');
    } else if (itemsProp.oneOf) {
        return itemsProp.oneOf.map(def => getItemType(def.type)).join('|');
    }

    return getItemType(itemsProp.type);
}

export class Property {
    private hiddenKey: string;
    private hiddenType: string;
    private hiddenProps: Array<Property>;
    private requiredProperties: Array<string>;
    private hiddenArrayItemsType: string;

    constructor(key: string, objProp: any) {
        this.hiddenKey = key;
        this.hiddenType = objProp.type;

        this.validate();

        if (this.hiddenType === 'object' && !!objProp.properties) {
            this.hiddenProps = Object.keys(objProp.properties).map(propKey => new Property(propKey, objProp.properties[propKey]));
            this.requiredProperties = objProp.required || [];
        } else {
            this.hiddenProps = [];
            this.requiredProperties = [];
        }

        if (this.hiddenType === 'array') {
            this.hiddenArrayItemsType = parseItems(objProp.items);
        }
    }

    get key(): string {
        return this.hiddenKey;
    }

    get properties(): Array<Property> {
        return this.hiddenProps;
    }

    get typescriptType(): string {
        // if we're of type array and we have an items array, make an array of specified types
        // otherwise if we're just an array with no specified items, allow any
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

        return this.hiddenType;
    }

    isPropertyRequired(key): boolean {
        return this.requiredProperties.includes(key);
    }

    validate(): void {
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