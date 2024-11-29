import React, { useEffect, useState } from 'react';
import { Table, Card, CardBody, Button, Col, Row, FormGroup, UncontrolledTooltip } from "reactstrap";
import { Navigate } from "react-router-dom";
import withRouter from 'components/Common/withRouter';
import { setBreadcrumbItems } from "../store/actions";
import { connect } from "react-redux";
import axios from "axios";
import { logErrorToServer } from 'utils/logError';
const PatientImagesList = (props) => {
    document.title = "Patient Images List | AGP Dental Tool";
    const breadcrumbItems = [
        { title: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, link: "/practiceList" },
        { title: sessionStorage.getItem('practiceName'), link: "/patientList" },
        { title: `${sessionStorage.getItem('patientName')} Images List`, link: "/patientImagesList" },
    ]
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    const [redirectToLogin, setRedirectToLogin] = useState(false);
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
    const [errorClr, setErrorClr] = useState('red');
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
            try {
                const today = new Date();
                const birthDate = new Date(dob);
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const monthDifference = today.getMonth() - birthDate.getMonth();

                if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                return calculatedAge;
            }
            catch (error) {
                console.log(error);
                logErrorToServer(error, "calculateAge");
                setError('Something went wrong. Please contact admin.');
                setErrorClr('red');
            }
        };

        const getPatientDetails = async () => {
            //console.log(sessionStorage.getItem('patientId'));
            try {
                const response = await axios.get(`${apiUrl}/getPatientByID?patientId=` + sessionStorage.getItem('patientId'),
                {
                  headers:{
                    Authorization:sessionStorage.getItem('token')
                  }
                });
                // const response = await axios.get('http://localhost:3000/getPatientByID?patientId=' + sessionStorage.getItem('patientId'));
                if (response.status === 200) {
                    const data = response.data;
                    sessionStorage.setItem('token', response.headers['new-token'])
                    // console.log(data);
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
            catch (error) {
                if(error.status===403||error.status===401){
                    sessionStorage.removeItem('token');
                    setRedirectToLogin(true);
                }
                else{
                  logErrorToServer(error, "getPatientDetails");
                console.log(error);
                setError('Something went wrong. Please contact admin.');
                setErrorClr('red');
                }
            }
        }

        getPatientDetails();
        getPatientVisits();
    }, [])
    const DateFormatter = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }).format(date);
    }
    const getPatientVisits = async () => {
        try {
            setVisitDetails([]);
            //console.log(sessionStorage.getItem('patientId'));
            const response = await axios.get(`${apiUrl}/getPatientVisitsByID?patientId=` + sessionStorage.getItem('patientId'),
            {
              headers:{
                Authorization:sessionStorage.getItem('token')
              }
            });
            //  const response = await axios.get('http://localhost:3001/getPatientVisitsByID?patientId=' + sessionStorage.getItem('patientId'));
            if (response.status === 200) {
                const visitData = response.data;
                sessionStorage.setItem('token', response.headers['new-token'])
                // const responseImages = await axios.get('http://localhost:3000/getPatientImagesByID?patientId=' + sessionStorage.getItem('patientId'));
                const responseImages = await axios.get(`${apiUrl}/getPatientImagesByID?patientId=` + sessionStorage.getItem('patientId'),
                {
                  headers:{
                    Authorization:sessionStorage.getItem('token')
                  }
                });
                if (responseImages.status === 200) {
                    sessionStorage.setItem('token', response.headers['new-token'])
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
        catch (error) {
            if(error.status===403||error.status===401){
                sessionStorage.removeItem('token');
                setRedirectToLogin(true);
            }
            else{
              logErrorToServer(error, "getPatientVisits");
            console.log(error);
            setError('Something went wrong. Please contact admin.');
            setErrorClr('red');
            }
        }
    }
    const [redirect, setRedirect] = useState(false);
    const [redirectToAnnotationPage, setRedirectToAnnotationPage] = useState(false);
    const handleClickPatientImage = () => {
        setError("");
        sessionStorage.setItem('patientId', patientId);
        setRedirect(true);
        sessionStorage.removeItem('visitId');
    };

    if (redirect) {
        return <Navigate to="/newPatientVisit" />;
    }
    if(redirectToLogin){
        return <Navigate to="/login"/>
    }
    const handleEditClick = (e, visitId, key) => {
        // return <Navigate to="/login" />
        e.stopPropagation();
        sessionStorage.setItem('visitId', visitId.visitId);
        setRedirect(true);
    }

    const handleClick = (visitId, key) => {
        try {
            setError("");
            if (visitId.patientImages.length > 0) {
                sessionStorage.setItem('visitId', visitId.patientImages[0].visitId);
                sessionStorage.setItem('xrayDate', visitId.DateOfXray);
                // console.log(visitId.DateOfXray);
                // console.log(key)
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
            else {
                setError("No images are available to annotate for this visit.")
                setErrorClr('red');
            }
        }
        catch (error) {
            logErrorToServer(error, "handleClick");
            console.log(error);
            setError('Something went wrong. Please contact admin.');
            setErrorClr('red');
        }
    };

    const handleInnerRowClick = (event) => {
        event.stopPropagation(); // Prevent the click from bubbling up
    };

    const handleDeleteClick = async (event) => {
        try {
            setError("");
            const checkboxes = document.querySelectorAll('#images-table .form-check-input');
            let checkedImages = "";
            checkboxes.forEach(function (checkbox) {
                const imgaeId = checkbox.getAttribute('data-id');
                const isChecked = checkbox.checked;

                if (isChecked) {
                    checkedImages += imgaeId + ",";
                }
            });
            if (checkedImages === "")
                alert('Please select atleast one image to delete.')
            else {
                const isConfirmed = window.confirm('Are you sure you want to delete?');
                if (isConfirmed) {
                    checkedImages = checkedImages.slice(0, -1);
                    // console.log(checkedImages);
                    let response = await axios.post(`${apiUrl}/delete-patient-image?ids=` + checkedImages,{},
                        {
                          headers:{
                            Authorization:sessionStorage.getItem('token')
                          }
                        })
                    if (response.status === 200) {
                        getPatientVisits();
                        sessionStorage.setItem('token', response.headers['new-token'])
                        setError('Image/s deleted successfully');
                        setErrorClr('green');
                    }
                }
            }
        }
        catch (error) {
            if(error.status===403||error.status===401){
                sessionStorage.removeItem('token');
                setRedirectToLogin(true);
            }
            else{
              logErrorToServer(error, "handleDeleteClick");
            console.log(error);
            setError('Something went wrong. Please contact admin.');
            setErrorClr('red');
            }
        }
    };

    const handleDownloadClick = async () => {
        try {
            setError("");

            try {

                const checkboxes = document.querySelectorAll('#images-table .form-check-input');
                let imageNames = [];
                checkboxes.forEach(function (checkbox) {
                    const isChecked = checkbox.checked;
                    if (isChecked) {
                        const imgaeSrc = checkbox.getAttribute('data-src');
                        // console.log(imgaeSrc);
                        const segments = imgaeSrc.split('/');
                        const imageName = segments[segments.length - 1].toString().slice(1);
                        // console.log(imageName);
                        imageNames = [...imageNames, imageName];
                        checkbox.checked = false;
                    }
                });
                if (imageNames.length === 0)
                    alert('Please select atleast one image to download.')
                else {
                    for (let imageName of imageNames) {
                        // Send a request to your Node.js backend to fetch and download the image
                        const response = await fetch(`${apiUrl}/download-image?imageName=${encodeURIComponent(imageName)}`,
                            {
                              headers:{
                                Authorization:sessionStorage.getItem('token')
                              }
                            });
                        // Check if the response is successful
                        if (!response.ok) {
                            throw new Error('Failed to download the image');
                        }

                        // Create a Blob from the response
                        const imageBlob = await response.blob();

                        // Create a temporary link to trigger the download
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(imageBlob);
                        link.download = imageName; // The filename of the image to be saved
                        link.click(); // Trigger the download

                        // Clean up the object URL after download
                        URL.revokeObjectURL(link.href);
                    };
                }
            } catch (error) {
                if(error.status===403||error.status===401){
                    sessionStorage.removeItem('token');
                    setRedirectToLogin(true);
                }
                else{
                  logErrorToServer(error, "handleDownloadClick");
                console.error('Download failed', error);
                }
            }

        }
        catch (error) {
            logErrorToServer(error, "handleDownloadClick");
            console.log(error);
            setError('Something went wrong. Please contact admin.');
            setErrorClr('red');
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
                            <Button type="button" onClick={() => { handleClickPatientImage() }} color="primary" className="waves-effect waves-light">New Visit</Button>{" "}
                        </Col>
                        <Col sm={10} style={{ textAlign: 'right' }}>
                            <Button type="button" color="primary" className="waves-effect waves-light" onClick={() => { handleDownloadClick() }}>Download</Button>&nbsp;&nbsp;&nbsp;&nbsp;
                            <Button type="button" color="primary" className="waves-effect waves-light" onClick={() => { handleDeleteClick() }}>Delete</Button>
                        </Col>

                    </Row><br></br>
                    {error && <p style={{ color: errorClr }}>{error}</p>}
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
                                    <th style={{ width: '10%' }}>Visit Date</th>
                                    <th style={{ width: '10%' }}>Date of Xray</th>
                                    <th style={{ width: '25%' }}>Summary</th>
                                    <th style={{ width: '5%' }}></th>
                                    <th style={{ width: '50%' }}>Patient Images</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    visitDetials.map((visit, key) =>
                                        <tr key={key} onClick={() => handleClick(visit, key)}>
                                            <td>{visit.visitDate}</td>
                                            <td>{visit.DateOfXray}</td>
                                            <td>{visit.Summary}</td>
                                            <td><button
                                                id="btnEdit"
                                                type="button"
                                                style={{ cssText: 'padding: 2px !important', fontSize: '25px' }}
                                                className="btn"
                                                onClick={(e) =>{e.stopPropagation(); handleEditClick(e, visit, key)}}
                                            >
                                                <i className='mdi mdi-pencil-box-outline'></i>
                                            </button>
                                                <UncontrolledTooltip placement="bottom" target="btnEdit">Edit Visit
                                                </UncontrolledTooltip>
                                            </td>
                                            <td>
                                                <Table id="images-table" className="align-middle table-centered table-vertical table-nowrap">
                                                    <tbody>
                                                        {
                                                            visit.patientImages.map((patient, keyPatient) =>
                                                                <tr key={keyPatient}>
                                                                    <td>
                                                                        <FormGroup>
                                                                            <div className="form-check">
                                                                                {/* <input type="hidden" name="imageId" value={patient._id} /> */}
                                                                                <input type="checkbox" data-id={patient._id} className="form-check-input"
                                                                                    id="formrow-customCheck" data-src={`${apiUrl}/${patient.thumbnail_url}`} />
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