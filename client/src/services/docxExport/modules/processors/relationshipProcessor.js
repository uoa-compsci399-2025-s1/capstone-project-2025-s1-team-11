import { RELATIONSHIP_TYPES } from "../utils/docxConstants.js";

/**
 * Updates relationship IDs in the body content to avoid conflicts
 */
export function updateRelationshipIds(content, relIdMap) {
    const updateIds = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
            obj.forEach(updateIds);
            return;
        }

        for (const [key, value] of Object.entries(obj)) {
            if ((key === '@_r:id' || key === '@_r:embed') && typeof value === 'string' && relIdMap.has(value)) {
                const oldId = value;
                const newId = relIdMap.get(value);
                if (obj[':@'] && obj[':@']['@_w:type'] === 'header' || obj[':@'] && obj[':@']['@_w:type'] === 'footer') {
                    console.log('[HEADER-DEBUG] Updating reference ID:', {
                        type: obj[':@']['@_w:type'],
                        oldId,
                        newId
                    });
                }
                obj[key] = newId;
            } else if (typeof value === 'object' && value !== null) {
                updateIds(value);
            }
        }
    };

    content.forEach(updateIds);
}

/**
 * Processes relationships from both documents and creates mapping for updates
 */
export function processRelationships(coverRels, bodyRels) {
    const relIdMap = new Map();
    const newRelationships = [];
    const mediaFileMap = new Map();

    // Find highest rId in cover page
    let maxRid = coverRels.reduce((max, rel) => {
        const idMatch = rel.id.match(/rId(\d+)/);
        return idMatch ? Math.max(max, parseInt(idMatch[1])) : max;
    }, 0);

    // Create map of cover page relationships by target path
    const coverRelsByTarget = new Map();
    console.log('[HEADER-DEBUG] Cover page relationships:', coverRels.filter(rel =>
        rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER
    ).map(rel => ({id: rel.id, target: rel.target})));

    coverRels.forEach(rel => {
        coverRelsByTarget.set(rel.target, rel);
    });

    // Process body relationships
    console.log('[HEADER-DEBUG] Body relationships before processing:', bodyRels.filter(rel =>
        rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER
    ).map(rel => ({id: rel.id, target: rel.target})));

    for (const rel of bodyRels) {
        const existingRel = coverRelsByTarget.get(rel.target);

        // For headers/footers, we want to reuse existing relationships if they exist
        if (existingRel &&
            existingRel.type === rel.type &&
            (rel.type === RELATIONSHIP_TYPES.HEADER ||
                rel.type === RELATIONSHIP_TYPES.FOOTER)) {
            // Use existing relationship for headers/footers
            console.log('[HEADER-DEBUG] Reusing existing header/footer:', {
                bodyId: rel.id,
                coverPageId: existingRel.id,
                target: rel.target
            });
            relIdMap.set(rel.id, existingRel.id);
            continue;
        }

        // Generate new relationship ID
        maxRid++;
        const newId = `rId${maxRid}`;
        relIdMap.set(rel.id, newId);

        // Handle file name conflicts
        let target = rel.target;
        if (coverRelsByTarget.has(target)) {
            if (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER) {
                console.log('[HEADER-DEBUG] Header/footer name conflict:', {
                    originalTarget: target,
                    bodyId: rel.id,
                    newId: newId
                });
            }

            // Extract path parts
            const lastSlash = target.lastIndexOf('/');
            const dir = lastSlash >= 0 ? target.substring(0, lastSlash + 1) : '';
            const filename = lastSlash >= 0 ? target.substring(lastSlash + 1) : target;
            const ext = filename.substring(filename.lastIndexOf('.'));
            const basename = filename.substring(0, filename.lastIndexOf('.'));

            // Extract number from basename if it exists
            const match = basename.match(/^(.*?)(\d*)$/);
            const prefix = match[1];
            let counter = match[2] ? parseInt(match[2]) : 0;

            // Keep incrementing counter until we find a unique name
            let newTarget;
            do {
                counter++;
                newTarget = `${dir}${prefix}${counter}${ext}`;
            } while (coverRelsByTarget.has(newTarget));

            if (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER) {
                console.log('[HEADER-DEBUG] Generated new header/footer name:', {
                    originalTarget: target,
                    newTarget: newTarget,
                    bodyId: rel.id,
                    newId: newId
                });
            }

            mediaFileMap.set(target, newTarget);
            target = newTarget;
        }

        newRelationships.push({
            id: newId,
            type: rel.type,
            target: target
        });
    }

    console.log('[HEADER-DEBUG] Final relationship mapping for headers/footers:',
        Array.from(relIdMap.entries())
            .filter(([oldId]) => bodyRels.find(rel =>
                rel.id === oldId &&
                (rel.type === RELATIONSHIP_TYPES.HEADER || rel.type === RELATIONSHIP_TYPES.FOOTER)
            ))
            .map(([oldId, newId]) => ({
                oldId,
                newId,
                target: bodyRels.find(rel => rel.id === oldId)?.target
            }))
    );

    return {relIdMap, newRelationships, mediaFileMap};
}

export function extractRelationships(relationshipsXml) {
    const relationships = [];
    const regex = /<Relationship\s+Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"/g;

    let match;
    while ((match = regex.exec(relationshipsXml)) !== null) {
        relationships.push({
            id: match[1],
            type: match[2],
            target: match[3]
        });
    }

    return relationships;
}

export function updateRelationshipsXml(originalXml, newRelationships) {
    if (!originalXml || originalXml.trim() === '') {
        // Create new relationships XML if none exists
        let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
        xml += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n';

        for (const rel of newRelationships) {
            xml += `  <Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>\n`;
        }

        xml += '</Relationships>';
        return xml;
    }

    // Add new relationships before the closing tag
    const closingTag = '</Relationships>';
    const insertIndex = originalXml.lastIndexOf(closingTag);

    if (insertIndex === -1) {
        throw new Error('Invalid relationships XML format');
    }

    let updatedXml = originalXml.substring(0, insertIndex);

    for (const rel of newRelationships) {
        updatedXml += `  <Relationship Id="${rel.id}" Type="${rel.type}" Target="${rel.target}"/>\n`;
    }

    updatedXml += closingTag;

    return updatedXml;
}