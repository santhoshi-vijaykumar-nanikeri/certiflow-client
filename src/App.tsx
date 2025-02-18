import React from "react";

import { Button, Paper } from "@mui/material";
interface IProps { }

const App: React.FC<IProps> = (props) => {
    const { } = props;

    return (<Paper elevation={3}>
        <Button variant="contained">Text</Button>
    </Paper>);
}

export default App;
