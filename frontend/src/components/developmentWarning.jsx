import {Alert} from "antd";
import React from "react";

const DevelopmentWarning = () => {
    return (
        <Alert
            message="Warning"
            description="Assessly is in early development. Features may be incomplete and bugs are expected."
            type="warning"
            showIcon
            closable
        />
    );
};
export default DevelopmentWarning;