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
import Flatpickr from "react-flatpickr"
import 'flatpickr/dist/flatpickr.min.css';
import axios from "axios";
import { logErrorToServer } from "utils/logError";
const NewPatient = (props) => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    document.title = "New Patient | AGP Dental Tool";
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("")
    const [gender, setGender] = useState("");
    const [dob, setDob] = useState('');
    const [errorClr, setErrorClr] = useState('red')
    const [ref_dob, setRef_dob] = useState(0);
    const [age, setAge] = useState(0)
    const [guardian_first_name, setGuardianFirstName] = useState("")
    const [guardian_last_name, setGuardianLastName] = useState("")
    const [guardian_relationship, setGuardianRelationship] = useState("")
    const [address, setAddress] = useState("")
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const [edit, setEdit] = useState(false);
    const [defaultAge, setDefaultAge] = useState(true);
    const [displayDob, setDisplayDob] = useState("")
    const [redirectToPatientList, setRedirectToPatientList] = useState(false);
    const [patientActive, setPatientActive] = useState(true);
    const [error, setError] = useState("")
    const breadcrumbItems = [
        { title: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, link: "/practiceList" },
        { title: sessionStorage.getItem('practiceName'), link: "/patientList" },
        { title: "New Patient", link: "/NewPatient" },
    ]
    const [patientId, setPatientId] = useState('');
    useEffect(() => {
        props.setBreadcrumbItems('New Patient', breadcrumbItems)
        if (sessionStorage.getItem('patientAddress')) {
            setFirstName(sessionStorage.getItem('patientFName'));
            setLastName(sessionStorage.getItem('patientLName'));
            setAddress(sessionStorage.getItem('patientAddress'));
            setGender(sessionStorage.getItem('patientGender'));
            setPatientId(sessionStorage.getItem('patientId'));
            setEmail(sessionStorage.getItem('patientEmail'));
            setTelephone(sessionStorage.getItem('patientTelephone'));
            setGuardianFirstName(sessionStorage.getItem('patientGFName'));
            setGuardianLastName(sessionStorage.getItem('patientGLName'));
            setGuardianRelationship(sessionStorage.getItem('patientGRelationship'));
            setPatientActive(sessionStorage.getItem('patientActive') === "false" ? false : true);
            if (sessionStorage.getItem('patientDOB')) {
                setDob(sessionStorage.getItem('patientDOB'));
                setDisplayDob(new Date(sessionStorage.getItem('patientDOB')))
                setDefaultAge(false);
            }
            else {
                const currentDate = new Date(); // Current date
                const birthDate = new Date(sessionStorage.getItem('patientAge'));
                setAge(currentDate.getFullYear() - birthDate.getFullYear());
            }
            setEdit(true);
        }
        else if (sessionStorage.getItem('patientId')) {
            sessionStorage.removeItem('patientId');
        }
    }, [])
    const handleCancelSubmit = async () => {
        if (edit) {
            sessionStorage.removeItem('patientFName');
            sessionStorage.removeItem('patientLName');
            sessionStorage.removeItem('patientAddress');
            sessionStorage.removeItem('patientGender');
            sessionStorage.removeItem('patientEmail');
            sessionStorage.removeItem('patientTelephone');
            sessionStorage.removeItem('patientGLName');
            sessionStorage.removeItem('patientGFName');
            sessionStorage.removeItem('patientGRelationship');
            sessionStorage.removeItem('patientActive');
            if (sessionStorage.getItem('patientDOB')) {
                sessionStorage.removeItem('patientDOB');
            }
            else {
                sessionStorage.removeItem('patientAge');
            }
        }
        setRedirectToPatientList(true);
    }
    const checkAge = () => {
        if (defaultAge) {
            if (age < 18 && (guardian_first_name === "" || guardian_last_name === "" || guardian_relationship === "")) {
                console.log(false, age, "age")
                return false
            }
        }
        else {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18 && (guardian_first_name === "" || guardian_last_name === "" || guardian_relationship === "")) {
                console.log(false, age)
                return false
            }
        }
        return true;
    }
    const handleNewPatientSubmit = async () => {
        if (email !== "" && firstName !== "" && lastName !== "" && (dob !== "" || ref_dob !== "") && telephone !== "" && (gender === "Male" || gender === "Female") && checkAge()) {
            try {
                let response;
                if (!defaultAge) {
                    // console.log(dob);
                    if (edit) {
                        response = await axios.post(`${apiUrl}/edit-patient`, {
                            //    response = await axios.post('http://localhost:3001/add-patient', {
                            first_name: firstName, last_name: lastName, email: email, telephone: telephone, gender: gender, dob: dob,
                            guardian_first_name: guardian_first_name, guardian_last_name: guardian_last_name, guardian_relationship: guardian_relationship, address: address,
                            is_active: true, created_by: "test", practiceId: sessionStorage.getItem('practiceId'), patientId: patientId, patientActive: patientActive
                        },
                            {
                                headers: {
                                    Authorization: sessionStorage.getItem('token')
                                }
                            })
                    }
                    else {
                        response = await axios.post(`${apiUrl}/add-patient`, {
                            //    response = await axios.post('http://localhost:3001/add-patient', {
                            first_name: firstName, last_name: lastName, email: email, telephone: telephone, gender: gender, dob: dob,
                            guardian_first_name: guardian_first_name, guardian_last_name: guardian_last_name, guardian_relationship: guardian_relationship, address: address,
                            is_active: true, created_by: "test", practiceId: sessionStorage.getItem('practiceId'), patientActive: patientActive
                        },
                            {
                                headers: {
                                    Authorization: sessionStorage.getItem('token')
                                }
                            })
                    }
                }
                else {
                    if (edit) {
                        response = await axios.post(`${apiUrl}/edit-patient`, {
                            //    response = await axios.post('http://localhost:3001/add-patient', {
                            first_name: firstName, last_name: lastName, email: email, telephone: telephone, gender: gender, reference_dob_for_age: ref_dob,
                            guardian_first_name: guardian_first_name, guardian_last_name: guardian_last_name, guardian_relationship: guardian_relationship, address: address,
                            is_active: true, created_by: 'test', practiceId: sessionStorage.getItem('practiceId'), patientId: patientId, patientActive: patientActive
                        },
                            {
                                headers: {
                                    Authorization: sessionStorage.getItem('token')
                                }
                            })
                    }
                    else {
                        response = await axios.post(`${apiUrl}/add-patient`, {
                            //    response = await axios.post('http://localhost:3001/add-patient', {
                            first_name: firstName, last_name: lastName, email: email, telephone: telephone, gender: gender, reference_dob_for_age: ref_dob,
                            guardian_first_name: guardian_first_name, guardian_last_name: guardian_last_name, guardian_relationship: guardian_relationship, address: address,
                            is_active: true, created_by: 'test', practiceId: sessionStorage.getItem('practiceId'), patientActive: patientActive
                        },
                            {
                                headers: {
                                    Authorization: sessionStorage.getItem('token')
                                }
                            })
                    }
                }
                if (response.status === 200) {
                    sessionStorage.setItem('patientId', response.data.user1._id);
                    sessionStorage.setItem('token', response.headers['new-token'])
                    setPatientId(response.data.user1._id);
                    sessionStorage.setItem('patientName', `${firstName} ${lastName}`);
                    if (edit) {
                        sessionStorage.removeItem('patientFName');
                        sessionStorage.removeItem('patientLName');
                        sessionStorage.removeItem('patientAddress');
                        sessionStorage.removeItem('patientGender');
                        sessionStorage.removeItem('patientEmail');
                        sessionStorage.removeItem('patientTelephone');
                        sessionStorage.removeItem('patientGLName');
                        sessionStorage.removeItem('patientGFName');
                        sessionStorage.removeItem('patientGRelationship');
                        sessionStorage.removeItem('patientActive');
                        if (sessionStorage.getItem('patientDOB')) {
                            sessionStorage.removeItem('patientDOB');
                        }
                        else {
                            sessionStorage.removeItem('patientAge');
                        }
                    }
                    setRedirect(true);
                }
            }
            catch (err) {
                if (err.status === 403 || err.status === 401) {
                    sessionStorage.removeItem('token');
                    setRedirectToLogin(true);
                }
                else {
                    logErrorToServer(err, "handleNewPatientSubmit");
                    console.error(err)
                }
            }
        }
        else {
            setError("Please fill out all the fields.\n For children guardian details are mandatory as well.");
        }
    }
    const setRef = (age) => {
        const date = new Date();
        setAge(age);
        const tmpDate = `${date.getFullYear() - age}-01-01`;
        const refDob = new Date(tmpDate);
        //console.log(refDob);
        setRef_dob(refDob);
    }
    const [redirect, setRedirect] = useState(false);
    if (redirectToPatientList) {
        return <Navigate to="/patientList" />
    }
    if (redirectToLogin) {
        return <Navigate to="/login" />
    }
    if (redirect) {
        return <Navigate to="/newPatientVisit" />;
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
                                    First Name <span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => { setFirstName(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Last Name
                                    <span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => { setLastName(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-email-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Email <span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value) }}
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
                                <label
                                    htmlFor="example-tel-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Gender<span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <select className="form-control" value={gender}
                                        onChange={(e) => { setGender(e.target.value) }}>
                                        <option>Select</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-radio-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Age/DOB<span style={{ color: 'red' }}> *</span>
                                </label>
                                <div className="col-md-9">
                                    <table style={{ width: '100%' }}>
                                        <tbody>
                                            <tr className="mb-3">
                                                <td>
                                                    <div className="form-check col-mb-3">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="exampleRadios"
                                                            id="exampleRadios1"
                                                            value="option1"
                                                            checked={defaultAge}
                                                            onClick={() => { setDefaultAge(true) }}
                                                        />
                                                        <label
                                                            className="form-check-label"
                                                            htmlFor="exampleRadios1"
                                                        >
                                                            Age
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-control"
                                                            type="number"
                                                            id="example-number-input"
                                                            value={age}
                                                            onChange={(e) => { setRef(e.target.value); }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="mb-3">
                                                <td>
                                                    <div className="form-check col-mb-3">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="exampleRadios"
                                                            id="exampleRadios2"
                                                            value="option2"
                                                            checked={!defaultAge}
                                                            onClick={() => { setDefaultAge(false) }}
                                                        />
                                                        <label
                                                            className="form-check-label"
                                                            htmlFor="exampleRadios2"
                                                        >
                                                            DOB
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="form-check col-mb-9">
                                                        <InputGroup>
                                                            <Flatpickr
                                                                className="form-control d-block"
                                                                placeholder="MMM d, yyyy"
                                                                id="example-date-input"
                                                                options={{
                                                                    dateFormat: "M d, Y"
                                                                }}
                                                                onChange={(selectedDates) => {
                                                                    // const formattedDate = selectedDates.length > 0 
                                                                    //     ? selectedDates[0].toLocaleDateString("en-GB") // Format to dd/mm/yyyy
                                                                    //     : "";
                                                                    if (selectedDates.length > 0) {
                                                                        const selectedDate = selectedDates[0];
                                                                        setDob(selectedDate);
                                                                        // console.log(formattedDate);
                                                                    }
                                                                    setDisplayDob(selectedDates[0]);
                                                                }}
                                                                value={displayDob}
                                                            />
                                                        </InputGroup>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
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
                                    htmlFor="example-text-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Guardian First Name
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={guardian_first_name}
                                        onChange={(e) => { setGuardianFirstName(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Guardian Last Name
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={guardian_last_name}
                                        onChange={(e) => { setGuardianLastName(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-3 col-form-label"
                                >
                                    Guardian Relationsip
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={guardian_relationship}
                                        onChange={(e) => { setGuardianRelationship(e.target.value) }}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <label htmlFor="example-text-input"
                                    className="col-md-3 col-form-label">
                                    Active
                                </label>
                                <div className="col-md-9">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="modelSwitch"
                                        checked={patientActive}
                                        onClick={() => setPatientActive(!patientActive)}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <div className="text-center mt-4">
                                    <button onClick={() => { handleNewPatientSubmit() }}
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

export default connect(null, { setBreadcrumbItems })(NewPatient);