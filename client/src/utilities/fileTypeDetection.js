export function detectFileType(filename) {
    return filename.split('.').pop().toLowerCase();
}