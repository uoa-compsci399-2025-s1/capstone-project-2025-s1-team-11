import { xmlParser } from "../utils/xmlHelpers.js";

/**
 * Parses [Content_Types].xml file content
 */
export function parseContentTypes(xml) {
    if (!xml) return [];

    const contentTypes = [];
    const doc = xmlParser.parse(xml);

    // Types element is in the second element of the array
    const types = doc[1]?.Types;
    if (!types) {
        console.warn('No Types element found in Content_Types.xml');
        return [];
    }

    // Process all elements in Types array
    types.forEach((item) => {
        // Handle Default entries
        if ('Default' in item) {
            const attrs = item[':@'];
            if (attrs) {
                contentTypes.push({
                    isDefault: true,
                    extension: attrs['@_Extension'],
                    contentType: attrs['@_ContentType']
                });
            }
        }

        // Handle Override entries
        if ('Override' in item) {
            const attrs = item[':@'];
            if (attrs) {
                contentTypes.push({
                    isDefault: false,
                    partName: attrs['@_PartName'],
                    contentType: attrs['@_ContentType']
                });
            }
        }
    });

    return contentTypes;
}

/**
 * Merges content types from two documents
 */
export function mergeContentTypes(coverTypes, bodyTypes) {
    const merged = new Map();

    // Helper to add a content type, preserving the first occurrence
    const addContentType = (ct) => {
        const key = ct.isDefault ? `default:${ct.extension}` : `override:${ct.partName}`;
        if (!merged.has(key)) {
            merged.set(key, ct);
        }
    };

    // Add ALL cover page types first (they take precedence)
    coverTypes.forEach(ct => addContentType(ct));

    // Add body types only if they don't conflict with cover page types
    bodyTypes.forEach(ct => addContentType(ct));

    // Ensure we have basic required defaults
    const ensureDefault = (extension, contentType) => {
        const key = `default:${extension}`;
        if (!merged.has(key)) {
            merged.set(key, {
                isDefault: true,
                extension,
                contentType
            });
        }
    };

    // Ensure minimum required defaults
    ensureDefault('rels', 'application/vnd.openxmlformats-package.relationships+xml');
    ensureDefault('xml', 'application/xml');

    return Array.from(merged.values());
}

/**
 * Builds [Content_Types].xml content
 */
export function buildContentTypesXml(contentTypes) {
    const defaults = contentTypes.filter(ct => ct.isDefault);
    const overrides = contentTypes.filter(ct => !ct.isDefault);

    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    xml += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';

    // Add defaults first
    defaults.forEach(ct => {
        xml += `<Default Extension="${ct.extension}" ContentType="${ct.contentType}"/>`;
    });

    // Then add overrides
    overrides.forEach(ct => {
        xml += `<Override PartName="${ct.partName}" ContentType="${ct.contentType}"/>`;
    });

    xml += '</Types>';
    return xml;
}