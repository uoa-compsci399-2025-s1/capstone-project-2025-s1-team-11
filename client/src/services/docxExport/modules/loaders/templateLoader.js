/**
 * Loads the DOCX template file from the public directory
 * @param {string} templateUrl - URL to the template file
 * @returns {Promise<ArrayBuffer>} - Template content as ArrayBuffer
 */
export async function loadTemplate(templateUrl = '/examTemplate.docx') {
    try {
        const response = await fetch(templateUrl, {
            cache: 'no-cache' // Force bypass cache
        });

        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
            throw new Error("Template file is empty");
        }

        return arrayBuffer;
    } catch (error) {
        console.error("Error loading template:", error);
        throw error;
    }
}

/**
 * Alternative loading method using XMLHttpRequest
 */
export async function loadTemplateAlt(templateUrl = '/examTemplate.docx') {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', templateUrl, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 304) {
                resolve(xhr.response);
            } else {
                reject(new Error(`Failed to load template: ${xhr.status}`));
            }
        };

        xhr.onerror = function () {
            reject(new Error('Network error loading template'));
        };

        xhr.send();
    });
}