import React, { useEffect, useState } from 'react';
import { Table, Card, CardBody, Button, Col, Row, FormGroup } from "reactstrap";
import { Navigate } from "react-router-dom";
import withRouter from 'components/Common/withRouter';
import { setBreadcrumbItems } from "../store/actions";
import { connect } from "react-redux";
import { Link } from "react-router-dom"
import axios from "axios"
const PatientImagesList = (props) => {
    document.title = "Patient Images List | AGP Dental Tool";
    const breadcrumbItems = [
        { title: "AGP", link: "#" },
        { title: "Practice List", link: "#" },
        { title: "Patient Images List", link: "#" },
    ]
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    // const visitDetials = [
    //     {
    //         visitDate: "2024-09-01", DateOfXray: "2024-09-01", Notes: "Initial caries lesion tooth #30",
    //         patientImages: [
    //             { thumbnail: "1.jpg" },
    //             { thumbnail: "2.jpg" }
    //         ]
    //     },
    //     {
    //         visitDate: "2024-08-16", DateOfXray: "2024-08-15", Notes: "To assess bone levels, caries",
    //         patientImages: [
    //             { thumbnail: "3.jpg" },
    //             { thumbnail: "4.jpg" },
    //             { thumbnail: "5.jpg" }
    //         ]
    //     },
    // ]

    // const patientImages = [
    //     { thumbnail: "1.jpg" },
    //     { thumbnail: "2.jpg" },
    //     { thumbnail: "3.jpg" },
    // ]
    const [patientId, setPatientId] = useState('');
    const [patient_name, setpatient_name] = useState('');
    const [patient_email, setpatient_email] = useState('');
    const [patient_phone, setpatient_phone] = useState('');
    const [patient_gender, setpatient_gender] = useState('');
    const [patient_add, setpatient_add] = useState('');
    const [patient_age, setpatient_age] = useState('');
    const [visitDetials, setVisitDetails] = useState([]);
    const [error, setError] = useState('');
    useEffect(() => {
        props.setBreadcrumbItems('Patient Images List', breadcrumbItems)
        setPatientId(sessionStorage.getItem('patientId'));
        //sessionStorage.removeItem('patientId');


        // const fetchImages = async () => {
        //     try {
        //       const res = await axios.get('http://localhost:3001/AnnotatedFiles/Thumbnail' , {responseType: 'blob'});
        //       console.log(res.data);
        //     } catch (err) {
        //       console.error(err);
        //     }
        // }
        //    fetchImages();
        const calculateAge = (dob) => {
            const today = new Date();
            const birthDate = new Date(dob);
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDifference = today.getMonth() - birthDate.getMonth();

            if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }

            return calculatedAge;
        };

        const getPatientDetails = async () => {
            //console.log(sessionStorage.getItem('patientId'));
            const response = await axios.get(`${apiUrl}/getPatientByID?patientId=` + sessionStorage.getItem('patientId'));
            // const response = await axios.get('http://localhost:3000/getPatientByID?patientId=' + sessionStorage.getItem('patientId'));
            if (response.status === 200) {
                const data = response.data;
                console.log(data);
                setpatient_name(data.patientList.last_name + ' ' + data.patientList.first_name)
                setpatient_email(data.patientList.email);
                setpatient_phone(data.patientList.telephone);
                setpatient_gender(data.patientList.gender);
                setpatient_add(data.patientList.address);
                if (data.patientList.date_of_birth)
                    setpatient_age(calculateAge(data.patientList.date_of_birth));
                else if (data.patientList.reference_dob_for_age)
                    setpatient_age(calculateAge(data.patientList.reference_dob_for_age));
            }
        }

        getPatientDetails();

        const DateFormatter = (date) => {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
            }).format(date);
        }

        const getPatientVisits = async () => {
            //console.log(sessionStorage.getItem('patientId'));
            const response = await axios.get(`${apiUrl}/getPatientVisitsByID?patientId=` + sessionStorage.getItem('patientId'));
            //  const response = await axios.get('http://localhost:3001/getPatientVisitsByID?patientId=' + sessionStorage.getItem('patientId'));
            if (response.status === 200) {
                const visitData = response.data;
                // const responseImages = await axios.get('http://localhost:3000/getPatientImagesByID?patientId=' + sessionStorage.getItem('patientId'));
                const responseImages = await axios.get(`${apiUrl}/getPatientImagesByID?patientId=` + sessionStorage.getItem('patientId'));
                if (responseImages.status === 200) {
                    await visitData.patienVisits.map(visit => {
                        const visitImages = responseImages.data.patienImages.filter(image => image.visitId === visit._id)
                        const visitDate = DateFormatter(new Date(visit.date_of_visit));
                        const xrayDate = DateFormatter(new Date(visit.date_of_xray));
                        const newVisit = [{
                            visitDate: visitDate, DateOfXray: xrayDate, Summary: visit.summary,
                            patientImages: visitImages, visitId: visit._id
                        }];
                        setVisitDetails(prevDetails => [...prevDetails, newVisit[0]]);
                    });
                }
            }
        }
        getPatientVisits();
    }, [])

    const [redirect, setRedirect] = useState(false);
    const [redirectToAnnotationPage, setRedirectToAnnotationPage] = useState(false);
    const handleClickPatientImage = () => {
        sessionStorage.setItem('patientId', patientId);
        setRedirect(true);
    };

    if (redirect) {
        return <Navigate to="/newPatientVisit" />;
    }

    const handleClick = (visitId, key) => {
        setError("");
        if (visitId.patientImages.length > 0) {
            sessionStorage.setItem('visitId', visitId.patientImages[0].visitId);
            sessionStorage.setItem('xrayDate', visitId.DateOfXray);
            console.log(visitId.DateOfXray);
            console.log(key)
            if (key === 0 && key === visitDetials.length - 1) {
                sessionStorage.setItem('first', true)
                sessionStorage.setItem('last', true)
            }
            else if (key === 0) {
                sessionStorage.setItem('first', false)
                sessionStorage.setItem('last', true)
            }
            else if (key === visitDetials.length - 1) {
                sessionStorage.setItem('last', false)
                sessionStorage.setItem('first', true)
            }
            else {
                sessionStorage.setItem('last', false)
                sessionStorage.setItem('first', false)
            }
            setRedirectToAnnotationPage(true);
        }
        else{
            setError("No images are available to annotate for this visit.")
        }
    };

    if (redirectToAnnotationPage) {
        return <Navigate to="/annotationPage" />;
    }

    return (
        <React.Fragment>
            <Card>
                <CardBody>
                    <h4 className="card-title mb-12">Patient List</h4>
                    <Row>
                        <Col sm={2}>
                            <Button type="button" onClick={() => { handleClickPatientImage() }} color="primary" className="waves-effect waves-light">New X-ray</Button>{" "}
                        </Col>
                        <Col sm={10} style={{ textAlign: 'right' }}>
                            <Button type="button" color="primary" className="waves-effect waves-light">Download</Button>&nbsp;&nbsp;&nbsp;&nbsp;
                            <Button type="button" color="primary" className="waves-effect waves-light">Delete</Button>
                        </Col>

                    </Row><br></br>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <Row>
                        <Col sm={4} className='card'>
                            <table>
                                <Row>
                                    <label
                                        htmlFor="example-text-input"
                                        className="col-md-3 col-form-label"
                                    >
                                        Name :
                                    </label>
                                    <label style={{ fontWeight: 100 }} className="col-md-9 col-form-label">{patient_name}</label>
                                </Row>
                                <Row>
                                    <label
                                        htmlFor="example-text-input"
                                        className="col-md-3 col-form-label"
                                    >
                                        Email :
                                    </label>
                                    <label style={{ fontWeight: 100 }} className="col-md-9 col-form-label">{patient_email}</label>
                                </Row>
                                <Row>
                                    <label
                                        htmlFor="example-text-input"
                                        className="col-md-3 col-form-label"
                                    >
                                        Telephone :
                                    </label>
                                    <label style={{ fontWeight: 100 }} className="col-md-9 col-form-label">{patient_phone}</label>
                                </Row>
                            </table>
                        </Col>

                        <Col sm={4} className='card'>
                            <table>
                                <Row>
                                    <label
                                        htmlFor="example-text-input"
                                        className="col-md-3 col-form-label"
                                    >
                                        Gender :
                                    </label>
                                    <label style={{ fontWeight: 100 }} className="col-md-9 col-form-label">{patient_gender}</label>
                                </Row>
                                <Row>
                                    <label
                                        htmlFor="example-text-input"
                                        className="col-md-3 col-form-label"
                                    >
                                        Age :
                                    </label>
                                    <label style={{ fontWeight: 100 }} className="col-md-9 col-form-label">{patient_age}</label>
                                </Row>
                            </table>
                        </Col>
                        <Col sm={4} className='card'>
                            <table>
                                <Row>
                                    <label
                                        htmlFor="example-text-input"
                                        className="col-md-3 col-form-label"
                                    >
                                        Address :
                                    </label>
                                    <label style={{ fontWeight: 100 }} className="col-md-9 col-form-label">{patient_add}</label>
                                </Row>    </table>
                        </Col>
                    </Row>
                    <div className="table-responsive">
                        <Table className="align-top table-vertical table-nowrap  table-hover">
                            <thead>
                                <tr>
                                    <th>Visit Date</th>
                                    <th>Date of Xray</th>
                                    <th>Summary</th>
                                    <th>Patient Images</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    visitDetials.map((visit, key) =>
                                        <tr key={key} onClick={() => handleClick(visit, key)}>
                                            <td>{visit.visitDate}</td>
                                            <td>{visit.DateOfXray}</td>
                                            <td>{visit.Summary}</td>
                                            <td>
                                                <Table className="align-middle table-centered table-vertical table-nowrap">
                                                    <tbody>
                                                        {
                                                            visit.patientImages.map((patient, keyPatient) =>
                                                                <tr key={keyPatient}>
                                                                    <td>
                                                                        <FormGroup>
                                                                            <div className="form-check">
                                                                                <input type="checkbox" className="form-check-input" id="formrow-customCheck" />
                                                                            </div>
                                                                        </FormGroup>{" "}
                                                                    </td>
                                                                    <td>
                                                                        {/* <img class='rounded avatar-sm card-img' src={`http://localhost:3000/${patient.thumbnail_url}`}></img> */}
                                                                        <img class='rounded avatar-sm card-img' src={`${apiUrl}/${patient.thumbnail_url}`}></img>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        }
                                                    </tbody>
                                                </Table>
                                            </td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        </Table>

                    </div>
                </CardBody>
            </Card>
        </React.Fragment>
    );

}

export default connect(null, { setBreadcrumbItems })(PatientImagesList);