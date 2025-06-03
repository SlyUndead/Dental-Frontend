import React, { useEffect, useState } from "react"
import {
    Card,
    CardBody,
    Col,
    Row,
    InputGroup
} from "reactstrap"
import { connect } from "react-redux";
import { Navigate } from "react-router-dom";
//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../store/actions";
import 'flatpickr/dist/flatpickr.min.css';
import axios from "axios";
import { logErrorToServer } from "utils/logError";
import sessionManager from "utils/sessionManager"
const NewPractice = (props) => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    document.title = "New Patient | Oral Wisdom";
    const [practiceName, setPracticeName] = useState("");
    const [telephone, setTelephone] = useState("")
    const [address, setAddress] = useState("")
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const [error, setError] = useState("")
    const [errorClr, setErrorClr] = useState('red')
    const [edit, setEdit] = useState(false)
    const [redirectToPracticeList, setRedirectToPracticeList] = useState(false);
    const breadcrumbItems = [
        { title: `${sessionManager.getItem('firstName')} ${sessionManager.getItem('lastName')}`, link: "/practiceList" },
        { title: "New Practice", link: "/NewPractice" },
    ]
    useEffect(() => {
        props.setBreadcrumbItems('New Practice', breadcrumbItems)
        if (sessionManager.getItem('practiceAddress')) {
            setAddress(sessionManager.getItem('practiceAddress'));
            setTelephone(sessionManager.getItem('practiceTelephone'));
            setPracticeName(sessionManager.getItem('practiceName'));
            setEdit(true);
        }
    }, [])
    const handleCancelSubmit = () => {
        if (edit) {
            sessionManager.removeItem('practiceAddress');
            sessionManager.removeItem('practiceTelephone');
            sessionManager.removeItem('practiceName');
        }
        setRedirectToPracticeList(true);
    }
    const handleNewPracticeSubmit = async () => {
        if (practiceName !== "" && telephone !== "" && address !== "") {
            try {
                let response;
                if (edit) {
                    response = await axios.post(`${apiUrl}/edit-practice`, {
                        name: practiceName, contactNo: telephone, address: address, clientId: sessionManager.getItem('clientId'), practiceId: sessionManager.getItem('practiceId')
                    },
                        {
                            headers: {
                                Authorization: sessionManager.getItem('token')
                            }
                        })
                }
                else {
                    response = await axios.post(`${apiUrl}/add-practice`, {
                        name: practiceName, contactNo: telephone, address: address, clientId: sessionManager.getItem('clientId')
                    },
                        {
                            headers: {
                                Authorization: sessionManager.getItem('token')
                            }
                        })
                }
                if (response.status === 200) {
                    if (edit) {
                        sessionManager.removeItem('practiceAddress');
                        sessionManager.removeItem('practiceTelephone');
                        sessionManager.setItem('practiceId', response.data.user2._id);
                        sessionManager.setItem('practiceName', response.data.user2.name);
                        sessionManager.setItem('token', response.headers['new-token']);
                    }
                    else {
                        sessionManager.setItem('practiceId', response.data.user1._id);
                        sessionManager.setItem('practiceName', response.data.user1.name);
                        sessionManager.setItem('token', response.headers['new-token']);
                    }
                    setRedirect(true);
                }
            }
            catch (err) {
                if (err.status === 403 || err.status === 401) {
                    sessionManager.removeItem('token');
                    setRedirectToLogin(true);
                }
                else {
                    logErrorToServer(err, "handleNewPatientSubmit");
                    setError("Unable to add. Please try again or contact admin")
                    console.error(err)
                }
            }
        }
        else {
            setError(`Please enter ${practiceName === "" ? "Practice Name" : ""} ${address === "" ? "Address" : ""} ${telephone === "" ? "Telephone" : ""}`)
        }
    }
    const [redirect, setRedirect] = useState(false);
    if (redirectToPracticeList) {
        return <Navigate to="/practiceList" />
    }
    if (redirectToLogin) {
        return <Navigate to="/login" />
    }
    if (redirect) {
        return <Navigate to="/patientList" />;
    }
    return (
        <React.Fragment>
            <Row>
                <Col>

                    <Card>
                        <CardBody>
                            {error && <p style={{ color: errorClr }}>{error}</p>}
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Practice Name <span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={practiceName}
                                        onChange={(e) => { setPracticeName(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-tel-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Address<span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={address}
                                        onChange={(e) => { setAddress(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-tel-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Telephone <span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="tel"
                                        value={telephone}
                                        onChange={(e) => { setTelephone(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <div className="text-center mt-4">
                                    <button onClick={() => { handleNewPracticeSubmit() }}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Submit
                                    </button>
                                    <button onClick={() => { handleCancelSubmit() }}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                        style={{ marginLeft: '1%' }}
                                    >
                                        Cancel
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

export default connect(null, { setBreadcrumbItems })(NewPractice);