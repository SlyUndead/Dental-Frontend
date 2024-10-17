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
import axios from "axios"
const NewPatient = (props) => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    document.title = "New Patient | AGP Dental Tool";
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("")
    const [gender, setGender] = useState("");
    const [dob, setDob] = useState('');
    //const [displayDob, setDisplayDob] = useState("")
    const [ref_dob, setRef_dob] = useState(0);
    const [dateOfXray, setDateOfXray] = useState(new Date());
    const [dateOfVisit, setDateOfVisit] = useState(new Date());
    // const [displayDateOfXray, setDisplayDateOfXray] = useState("");
    const [notes, setNotes] = useState('');
    const [summary, setSummary] = useState('');
    const [age, setAge] = useState(0)
    const [guardian_first_name, setGuardianFirstName] = useState("")
    const [guardian_last_name, setGuardianLastName] = useState("")
    const [guardian_relationship, setGuardianRelationship] = useState("")
    const [address, setAddress] = useState("")
    
    const breadcrumbItems = [
        { title: "AGP", link: "#" },
        { title: "Practice List", link: "#" },
        { title: "New Patient", link: "#" },
    ]
    const [patientId, setPatientId] = useState('');
    useEffect(() => {
        props.setBreadcrumbItems('New Patient', breadcrumbItems)
        if (sessionStorage.getItem('patientId')) {
            sessionStorage.removeItem('patientId');
        }
    }, [])
   
    const handleNewPatientSubmit = async () => {
        if (email !== "" && firstName !== "" && lastName !== "" && (dob !== "" || ref_dob !== "") && telephone !== "" && (gender === "Male" || gender === "Female")) {
            try {
                let response;
                if (dob !== "") {
                    console.log(dob);
                    response = await axios.post(`${apiUrl}/add-patient`, {
                        //    response = await axios.post('http://localhost:3001/add-patient', {
                        first_name: firstName, last_name: lastName, email: email, telephone: telephone, gender: gender, dob: dob,
                        guardian_first_name: guardian_first_name, guardian_last_name: guardian_last_name, guardian_relationship: guardian_relationship, address: address,
                        is_active: true, created_by: "test", practiceId: sessionStorage.getItem('practiceId')
                    })
                }
                else {
                    response = await axios.post(`${apiUrl}/add-patient`, {
                        //    response = await axios.post('http://localhost:3001/add-patient', {
                        first_name: firstName, last_name: lastName, email: email, telephone: telephone, gender: gender, reference_dob_for_age: ref_dob,
                        guardian_first_name: guardian_first_name, guardian_last_name: guardian_last_name, guardian_relationship: guardian_relationship, address: address,
                        is_active: true, created_by: 'test', practiceId: sessionStorage.getItem('practiceId')
                    })
                }
                if (response.status === 200) {
                    sessionStorage.setItem('patientId', response.data.user1._id);
                    setPatientId(response.data.user1._id);
                    setRedirect(true);
                }
            }
            catch (err) {
                console.error(err)
            }
        }
    }
    const setRef = (age) => {
        const date = new Date();
        setAge(age);
        const tmpDate = `${date.getFullYear() - age}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate()}`;
        const refDob = new Date(tmpDate);
        //console.log(refDob);
        setRef_dob(refDob);
    }
    const [redirect, setRedirect] = useState(false);

    if (redirect) {
        return <Navigate to="/newPatientVisit" />;
    }
    return (
        <React.Fragment>
            <Row>
                <Col>

                    <Card>
                        <CardBody>
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
                                                            defaultChecked
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

                                                                        // Format the date to 'Sep 23 2024'
                                                                        const formattedDate = selectedDate.toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        });

                                                                        setDob(selectedDate);
                                                                        console.log(formattedDate);
                                                                    }
                                                                    //setDisplayDob(selectedDates[0]);
                                                                }}
                                                            //value={displayDob}
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
                                <div className="text-center mt-4">
                                    <button onClick={() => { handleNewPatientSubmit() }}
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

export default connect(null, { setBreadcrumbItems })(NewPatient);