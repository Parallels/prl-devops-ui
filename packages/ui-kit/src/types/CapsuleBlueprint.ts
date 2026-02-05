export enum CapsuleBlueprintValueType {
    String = "string",
    Int = "int",
    Boolean = "boolean",
    Select = "select",
    List = "list",
    Map = "map"
}

export interface CapsuleBlueprintParameter {
    name: string;
    key: string;
    description?: string;
    type?: string;
    value_type?: CapsuleBlueprintValueType;
    default?: any;
    required?: boolean;
    is_required?: boolean;
    is_secret?: boolean;
    options?: any;
    hint?: string;
    help?: string;
    service_name?: string;
    depends_on?: string[];
    [key: string]: any;
}
