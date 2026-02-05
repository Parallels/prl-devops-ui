export interface DependencyCondition {
    field_name: string;
    field_value: string;
    operator: string;
    condition?: 'and' | 'or';
}

export interface FileUploadData {
    files: File | File[];
    names: string;
    count: number;
}

export interface FormData {
    [key: string]:
    | string
    | boolean
    | Array<{ key: string; value: string }>
    | string[]
    | FileUploadData;
}

/**
 * Evaluates if a field should be visible based on its dependencies
 * @param fieldName - The name of the field being evaluated
 * @param dependencies - Array of dependency conditions
 * @param formData - Current form data
 * @returns boolean indicating if the field should be visible
 */
export function evaluateFieldVisibility(
    _fieldName: string,
    dependencies: DependencyCondition[],
    formData: FormData
): boolean {
    if (!dependencies || dependencies.length === 0) {
        return true; // No dependencies = always visible
    }

    // console.info(`🔍 Evaluating visibility for field: ${fieldName}`);
    // console.info(`📋 Dependencies:`, dependencies);

    // Group dependencies by condition (and/or)
    const andDependencies: DependencyCondition[] = [];
    const orDependencies: DependencyCondition[] = [];

    dependencies.forEach((dep, index) => {
        if (index === 0 || dep.condition === 'and') {
            andDependencies.push(dep);
        } else if (dep.condition === 'or') {
            orDependencies.push(dep);
        }
    });

    // console.info(`🔗 AND dependencies:`, andDependencies);
    // console.info(`🔗 OR dependencies:`, orDependencies);

    // Evaluate AND dependencies first
    let andResult = true;
    if (andDependencies.length > 0) {
        andResult = andDependencies.every((dep) => evaluateSingleDependency(dep, formData));
        // console.info(`✅ AND dependencies result: ${andResult}`);
    }

    // Evaluate OR dependencies
    let orResult = false;
    if (orDependencies.length > 0) {
        orResult = orDependencies.some((dep) => evaluateSingleDependency(dep, formData));
        // console.info(`✅ OR dependencies result: ${orResult}`);
    }

    // Combine results: if there are OR dependencies, use OR logic; otherwise use AND result
    const finalResult = orDependencies.length > 0 ? andResult && orResult : andResult;

    // console.info(`🎯 Final visibility result for ${fieldName}: ${finalResult}`);
    return finalResult;
}

/**
 * Evaluates a single dependency condition
 * @param dependency - The dependency condition to evaluate
 * @param formData - Current form data
 * @returns boolean indicating if the condition is met
 */
function evaluateSingleDependency(dependency: DependencyCondition, formData: FormData): boolean {
    const { field_name, field_value, operator } = dependency;
    const actualField = formData[field_name];

    // console.info(`🔍 Evaluating dependency: ${field_name} ${operator} ${field_value}`);
    // console.info(`📊 Actual value: ${JSON.stringify(actualField)} (type: ${typeof actualField})`);

    // Handle file upload data - use the names property for evaluation
    let actualValue = actualField;
    if (actualField && typeof actualField === 'object' && 'names' in actualField) {
        actualValue = actualField.names;
    }

    let isArray = false;
    if (Array.isArray(actualValue)) {
        isArray = true;
    }
    let isString = false;
    if (typeof actualValue === 'string') {
        isString = true;
    }

    // Convert actual value to string for comparison
    const safeActualValue = actualValue || '';
    const actualValueStr =
        typeof safeActualValue === 'object' ? JSON.stringify(safeActualValue) : String(safeActualValue);

    const safeFieldValue = field_value || '';
    const expectedValueStr =
        typeof safeFieldValue === 'object' ? JSON.stringify(safeFieldValue) : String(safeFieldValue);

    // console.info(`🔍 Actual value: ${actualValueStr} (type: ${typeof actualValueStr})`);
    // console.info(`🔍 Expected value: ${expectedValueStr} (type: ${typeof expectedValueStr})`);

    let result = false;

    switch (operator) {
        case 'eq':
            if (isString) {
                result = actualValueStr.toLowerCase() === expectedValueStr.toLowerCase();
            } else {
                result = actualValueStr === expectedValueStr;
            }
            break;
        case 'nq':
            if (isString) {
                result = actualValueStr.toLowerCase() !== expectedValueStr.toLowerCase();
            } else {
                result = actualValueStr !== expectedValueStr;
            }
            break;
        case 'gt':
            if (isArray) {
                result =
                    (actualValue as Array<{ key: string; value: string }>).length >
                    parseInt(expectedValueStr);
            } else if (actualField && typeof actualField === 'object' && 'count' in actualField) {
                result = actualField.count > parseInt(expectedValueStr);
            } else {
                result = parseFloat(actualValueStr) > parseFloat(expectedValueStr);
            }
            break;
        case 'lt':
            if (isArray) {
                result =
                    (actualValue as Array<{ key: string; value: string }>).length <
                    parseInt(expectedValueStr);
            } else if (actualField && typeof actualField === 'object' && 'count' in actualField) {
                result = actualField.count < parseInt(expectedValueStr);
            } else {
                result = parseFloat(actualValueStr) < parseFloat(expectedValueStr);
            }
            break;
        case 'gte':
            if (isArray) {
                result =
                    (actualValue as Array<{ key: string; value: string }>).length >=
                    parseInt(expectedValueStr);
            } else if (actualField && typeof actualField === 'object' && 'count' in actualField) {
                result = actualField.count >= parseInt(expectedValueStr);
            } else {
                result = parseFloat(actualValueStr) >= parseFloat(expectedValueStr);
            }
            break;
        case 'lte':
            if (isArray) {
                result =
                    (actualValue as Array<{ key: string; value: string }>).length <=
                    parseInt(expectedValueStr);
            } else if (actualField && typeof actualField === 'object' && 'count' in actualField) {
                result = actualField.count <= parseInt(expectedValueStr);
            } else {
                result = parseFloat(actualValueStr) <= parseFloat(expectedValueStr);
            }
            break;
        case 'contains':
            if (isArray) {
                result = (actualValue as Array<{ key: string; value: string }>).some((item) =>
                    item.value.toLowerCase().includes(expectedValueStr.toLowerCase())
                );
            } else {
                if (isString) {
                    result = actualValueStr.toLowerCase().includes(expectedValueStr.toLowerCase());
                } else {
                    result = actualValueStr.includes(expectedValueStr);
                }
            }
            break;
        case 'starts_with':
            if (isArray) {
                result = (actualValue as Array<{ key: string; value: string }>).some((item) =>
                    item.value.toLowerCase().startsWith(expectedValueStr.toLowerCase())
                );
            } else {
                if (isString) {
                    result = actualValueStr.toLowerCase().startsWith(expectedValueStr.toLowerCase());
                } else {
                    result = actualValueStr.startsWith(expectedValueStr);
                }
            }
            break;
        case 'empty':
            if (isArray) {
                result = (actualValue as Array<{ key: string; value: string }>).length === 0;
            } else if (actualField && typeof actualField === 'object' && 'count' in actualField) {
                result = actualField.count === 0;
            } else {
                if (isString) {
                    result = actualValueStr.trim() === '';
                } else {
                    result = actualValueStr.trim() === '';
                }
            }
            break;
        case 'not_empty':
            if (isArray) {
                result = (actualValue as Array<{ key: string; value: string }>).length > 0;
            } else if (actualField && typeof actualField === 'object' && 'count' in actualField) {
                result = actualField.count > 0;
            } else {
                if (isString) {
                    result = actualValueStr.trim() !== '';
                } else {
                    result = actualValueStr.trim() !== '';
                }
            }
            break;
        default:
            console.warn(`⚠️ Unknown operator: ${operator}`);
            result = false;
    }

    // console.info(`✅ Dependency result: ${result} (${field_name} ${operator} ${field_value})`);
    return result;
}

/**
 * Evaluates visibility for all fields in a form
 * @param parameters - Array of parameters with dependencies
 * @param formData - Current form data
 * @returns Object mapping field names to visibility states
 */
export function evaluateAllFieldVisibility(
    parameters: Array<{ key: string; dependencies?: DependencyCondition[] }>,
    formData: FormData
): Record<string, boolean> {
    const visibilityMap: Record<string, boolean> = {};

    parameters.forEach((param) => {
        visibilityMap[param.key] = evaluateFieldVisibility(
            param.key,
            param.dependencies || [],
            formData
        );
    });

    return visibilityMap;
}
