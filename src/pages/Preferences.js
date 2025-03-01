import React, { useEffect, useState } from "react"

import { connect } from "react-redux";
import {
    Card,
    CardBody,
    Col,
    Row
} from "reactstrap"
//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../store/actions";
import { logErrorToServer } from '../utils/logError';
const Preferences = (props) => {
    document.title = "Preferences | AGP Dental Tool";

    const breadcrumbItems = [
        { title: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, link: "/practiceList" },
        { title: sessionStorage.getItem('practiceName'), link: "/patientList" },
        { title: "Preferences", link: "/preferences" },
    ]
    const [ipAdd, setipAdd] = useState('');
    const [promptTemplate, setPromptTemplate] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setError('');
        try {
            props.setBreadcrumbItems('Preferences', breadcrumbItems)
            if (localStorage.getItem('apiIpAdd') !== null && localStorage.getItem('apiIpAdd') !== '')
                setipAdd(localStorage.getItem('apiIpAdd'));
            if (localStorage.getItem('promptTemplate') !== null && localStorage.getItem('promptTemplate') !== '')
                setipAdd(localStorage.getItem('promptTemplate'));
        }
        catch (error) {
            logErrorToServer(error, "useEffect");
            setError(process.env.REACT_APP_ERRORMSG);
        }
    }, [])

    const handleIPInputChange = (event) => {
        setError('');
        setipAdd(event.target.value);
    };
    const handleIPButtonClick = () => {
        setError('');
        localStorage.setItem('apiIpAdd', ipAdd);
        //console.log(localStorage.getItem('apiIpAdd'));
    };
    const handleIPResetClick = () => {
        setError('');
        setipAdd('');
        localStorage.removeItem('apiIpAdd');
        //console.log(localStorage.getItem('apiIpAdd'));
    };
    const handleChatBotInputChange = (event) => {
        setError('');
        setPromptTemplate(event.target.value);
    };
    const handleChatBotButtonClick = () => {
        setError('');
        localStorage.setItem('promptTemplate', promptTemplate);
        //console.log(localStorage.getItem('apiIpAdd'));
    };
    const handleChatBotResetClick = () => {
        setError('');
        setPromptTemplate('');
        localStorage.removeItem('promptTemplate');
        //console.log(localStorage.getItem('apiIpAdd'));
    };

    return (
        <React.Fragment>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-2 col-form-label"
                                >
                                    IP Address of API
                                </label>
                                <div className="col-md-10">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={ipAdd}
                                        onChange={handleIPInputChange}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <div className="text-center mt-4">
                                    <button onClick={handleIPResetClick}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Reset
                                    </button>
                                    &nbsp;&nbsp;&nbsp;&nbsp;
                                    <button onClick={handleIPButtonClick}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Save
                                    </button>
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-2 col-form-label"
                                >
                                    Prompt for ChatBot
                                </label>
                                <div className="col-md-10">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={promptTemplate}
                                        onChange={handleChatBotInputChange}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <div className="text-center mt-4">
                                    <button onClick={handleChatBotResetClick}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Reset
                                    </button>
                                    &nbsp;&nbsp;&nbsp;&nbsp;
                                    <button onClick={handleChatBotButtonClick}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Save
                                    </button>
                                </div>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(Preferences);