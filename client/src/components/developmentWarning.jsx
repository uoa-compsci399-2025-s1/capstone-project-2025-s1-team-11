import {Alert} from "antd";
import React from "react";

const DevelopmentWarning = () => {
    return (
        <Alert
            message="Warning"
            description="Assessly is in development. Features should be complete, however bugs are expected. Please report any bugs you encounter to Team 11. "
            type="warning"
            showIcon
            closable
        />
    );
};
export default DevelopmentWarning;