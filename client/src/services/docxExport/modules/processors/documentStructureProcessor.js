/**
 * Helper function to safely extract header/footer references from section properties
 */
export function extractRefs(sectPr, refType) {
    if (!Array.isArray(sectPr)) return [];

    return sectPr
        .filter(item => item[refType] && Array.isArray(item[refType]) && item[refType][0] && item[refType][0][':@'])
        .map(item => ({
            type: item[refType][0][':@']['@_w:type'] || 'unknown',
            id: item[refType][0][':@']['@_r:id'] || 'unknown'
        }));
}

/**
 * Helper to find and remove the first <w:sectPr> and return its value and location
 */
export function findAndRemoveFirstSectPr(docBodyArray) {
    let firstSectPr = null;
    let location = null;

    // Recursive function to walk through all elements
    function walkElement(element, path = []) {
        if (!element || typeof element !== 'object' || firstSectPr) return;

        // Check if this element has w:sectPr
        if (element['w:sectPr']) {
            // Debug the section properties before removal
            console.log('[SECTPR-DEBUG] Found section properties:', {
                path: path.join(' > '),
                headerRefs: extractRefs(element['w:sectPr'], 'w:headerReference'),
                footerRefs: extractRefs(element['w:sectPr'], 'w:footerReference')
            });
            firstSectPr = element['w:sectPr'];
            location = {path, element};
            return;
        }

        // Recursively check all properties and array items
        for (const [key, value] of Object.entries(element)) {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    walkElement(item, [...path, `${key}[${index}]`]);
                });
            } else if (typeof value === 'object' && value !== null) {
                walkElement(value, [...path, key]);
            }
        }
    }

    // Walk through each top-level element
    for (let i = 0; i < docBodyArray.length && !firstSectPr; i++) {
        walkElement(docBodyArray[i], [`body[${i}]`]);
    }

    if (firstSectPr && location) {
        // Parse the path to find the section
        const bodyIndex = parseInt(location.path[0].match(/body\[(\d+)\]/)?.[1]);
        if (isNaN(bodyIndex)) {
            return null;
        }

        // Navigate to the container of the sectPr
        let container = docBodyArray[bodyIndex];
        for (let i = 1; i < location.path.length - 1; i++) {
            const pathPart = location.path[i];
            const [key, indexStr] = pathPart.split('[');
            const index = indexStr ? parseInt(indexStr) : null;

            if (index !== null) {
                container = container[key.replace(']', '')][index];
            } else {
                container = container[key];
            }

            if (!container) {
                return null;
            }
        }

        // Debug the section properties before removal
        console.log('[SECTPR-DEBUG] About to remove section properties from:', {
            containerType: Object.keys(container)[0],
            hasDirectSectPr: !!container['w:sectPr'],
            hasPPrSectPr: !!(container['w:pPr'] && container['w:pPr'][0] && container['w:pPr'][0]['w:sectPr']),
            headerRefs: container['w:sectPr'] ? extractRefs(container['w:sectPr'], 'w:headerReference') : []
        });

        // Remove the sectPr
        if (container['w:sectPr']) {
            delete container['w:sectPr'];
        } else if (container['w:pPr'] && container['w:pPr'][0]) {
            delete container['w:pPr'][0]['w:sectPr'];
        }

        return {
            sectPr: firstSectPr,
            type: 'found',
            index: bodyIndex
        };
    }

    return null;
}