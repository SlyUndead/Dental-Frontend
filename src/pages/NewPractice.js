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
const NewPractice = (props) => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    document.title = "New Patient | AGP Dental Tool";
    const [practiceName, setPracticeName] = useState("");
    const [telephone, setTelephone] = useState("")
    const [address, setAddress] = useState("")
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const [error, setError] = useState("")
    const [errorClr, setErrorClr] = useState('red')
    const [edit, setEdit] = useState(false)
    const breadcrumbItems = [
        { title: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, link: "/practiceList" },
        { title: "New Practice", link: "/NewPractice" },
    ]
    useEffect(() => {
        props.setBreadcrumbItems('New Practice', breadcrumbItems)
        if(sessionStorage.getItem('practiceAddress')){
            setAddress(sessionStorage.getItem('practiceAddress'));
            setTelephone(sessionStorage.getItem('practiceTelephone'));
            setPracticeName(sessionStorage.getItem('practiceName'));
            setEdit(true);
        }
    }, [])
   
    const handleNewPracticeSubmit = async () => {
        if (practiceName !== "" && telephone !== "" && address !== "") {
            try {
                let response;
                    if(edit){
                        response = await axios.post(`${apiUrl}/edit-practice`, {
                            name: practiceName, contactNo: telephone, address: address, clientId: sessionStorage.getItem('clientId'), practiceId: sessionStorage.getItem('practiceId')
                        },
                        {
                          headers:{
                            Authorization:sessionStorage.getItem('token')
                          }
                        })
                    }
                    else{
                    response = await axios.post(`${apiUrl}/add-practice`, {
                        name: practiceName, contactNo: telephone, address: address, clientId: sessionStorage.getItem('clientId')
                    },
                    {
                      headers:{
                        Authorization:sessionStorage.getItem('token')
                      }
                    })}
                if (response.status === 200) {
                    if(edit){
                        sessionStorage.removeItem('practiceAddress');
                        sessionStorage.removeItem('practiceTelephone');
                        sessionStorage.setItem('practiceId', response.data.user2._id);
                        sessionStorage.setItem('practiceName', response.data.user2.name);
                        sessionStorage.setItem('token', response.headers['new-token']);
                    }
                    else{
                        sessionStorage.setItem('practiceId', response.data.user1._id);
                        sessionStorage.setItem('practiceName', response.data.user1.name);
                        sessionStorage.setItem('token', response.headers['new-token']);
                    }
                    setRedirect(true);
                }
            }
            catch (err) {
                if(err.status===403||err.status===401){
                    sessionStorage.removeItem('token');
                    setRedirectToLogin(true);
                }
                else{
                  logErrorToServer(err, "handleNewPatientSubmit");
                  setError("Unable to add. Please try again or contact admin")
                console.error(err)
                }
            }
        }
        else{
            setError(`Please enter ${practiceName===""?"Practice Name":""} ${address===""?"Address":""} ${telephone===""?"Telephone":""}`)  
        }
    }
    const [redirect, setRedirect] = useState(false);
    if(redirectToLogin){
        return <Navigate to="/login"/>
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