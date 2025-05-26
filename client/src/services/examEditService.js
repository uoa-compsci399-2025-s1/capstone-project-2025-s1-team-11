import { updateExamField, setExamVersions, setTeleformOptions } from "../store/exam/examSlice";

/**
 * Handles saving exam details by dispatching appropriate actions
 * @param {Object} editDetailsData - The exam details to save
 * @param {Function} dispatch - The Redux dispatch function
 * @param {Function} onSuccess - Callback function to execute on successful save
 */
export const handleExamDetailsSave = (editDetailsData, dispatch, onSuccess) => {
    // Update basic exam fields
    dispatch(updateExamField({ field: 'examTitle', value: editDetailsData.examTitle }));
    dispatch(updateExamField({ field: 'courseCode', value: editDetailsData.courseCode }));
    dispatch(updateExamField({ field: 'courseName', value: editDetailsData.courseName }));
    dispatch(updateExamField({ field: 'semester', value: editDetailsData.semester }));
    dispatch(updateExamField({ field: 'year', value: editDetailsData.year }));
    
    // Handle exam versions
    if (editDetailsData.versions !== undefined) {
        const versionsArray = typeof editDetailsData.versions === 'string'
            ? editDetailsData.versions.split(',').map(v => v.trim())
            : editDetailsData.versions;
        dispatch(setExamVersions(versionsArray));
    }

    // Handle teleform options
    if (editDetailsData.teleformOptions !== undefined) {
        const teleformOptionsArray = typeof editDetailsData.teleformOptions === 'string'
            ? editDetailsData.teleformOptions.split(',').map(o => o.trim())
            : editDetailsData.teleformOptions;
        dispatch(setTeleformOptions(teleformOptionsArray));
    }

    // Execute success callback if provided
    if (onSuccess) {
        onSuccess();
    }
}; 