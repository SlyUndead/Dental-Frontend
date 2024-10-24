import React, { useEffect, useState } from 'react';
import { Table, Card, CardBody, Button, Col, Row } from "reactstrap";
import { Navigate } from "react-router-dom";
import withRouter from 'components/Common/withRouter';
import { setBreadcrumbItems } from "../store/actions";
import { connect } from "react-redux";
import { Link } from "react-router-dom"
import axios from 'axios';

const PatientList = (props) => {
    document.title = "Patients List | AGP Dental Tool";
    const breadcrumbItems = [
        { title: "AGP", link: "#" },
        { title: "Practice List", link: "#" },
        { title: "Patient List", link: "#" },
    ]
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    // const patients = [
    //     { name: "Herbert C. Patton", age: "20", gender: "Male", date: "5/12/2024" },
    //     { name: "Mathias N. Klausen", age: "32", gender: "Female", date: "10/11/2024" },
    //     { name: "Nikolaj S. Henriksen", age: "16", gender: "Male", date: "8/11/2024" },
    //     { name: "Lasse C. Overgaard", age: "45", gender: "Female", date: "7/11/2024" },
    //     { name: "Kasper S. Jessen", age: "54", gender: "Male", date: "1/11/2024" },
    // ]

    useEffect(() => {
        props.setBreadcrumbItems('PatientList', breadcrumbItems)
        
    }, [])

    const [redirect, setRedirect] = useState(false);
    const [redirectToImages, setRedirectToImages] = useState(false);
    const [patients, setPatients] = useState([]);
    
    useEffect(()=>{
        const practiceId = sessionStorage.getItem('practiceId');
        const getPatientList= async()=>{const response = await axios.get(`${apiUrl}/getPatient?practiceId=` + practiceId); // Adjust the API endpoint as needed
        //const getPatientList= async()=>{const response = await axios.get('http://localhost:3001/getPatient?practiceId=' + practiceId); 
        const data = response.data;
        setPatients(data.patientList);}

        getPatientList()
    },[])

    const handleClickNewPatient = () => {
        setRedirect(true);
    };

    if (redirect) {
        return <Navigate to="/newPatient" />;
    }

    const handleClick = (patientId) => {
        //console.log(patinetId);
        sessionStorage.setItem('patientId',patientId);
        setRedirectToImages(true);
    };

    if (redirectToImages) {
        return <Navigate to="/patientImagesList" />;
    }

    
    return (
        <React.Fragment>
            <Card>
                <CardBody>
                    <Row>
                        <Col sm={12}>
                            <Button type="button" onClick={() => { handleClickNewPatient() }} color="primary" className="waves-effect waves-light">New Patient</Button>&nbsp;&nbsp;&nbsp;&nbsp;
                            <Button type="button" color="primary" className="waves-effect waves-light">Print</Button>
                        </Col>
                    </Row>
                    <div className="table-responsive">
                        <Table className="align-middle table-centered table-vertical table-nowrap  table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Telephone</th>
                                    <th>Gender</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    patients.map((patient, key) =>
                                        <tr key={key} onClick={() => handleClick(patient._id)}>
                                            <td>{patient.last_name}  &nbsp;  {patient.first_name}
                                                {/* <Link to="/patientImagesList" type="button" outline color="success" className="waves-effect waves-light">
                                                    <span>{patient.name}</span>
                                                </Link> */}
                                                {/* <a href="https://www.example.com" target="_blank" rel="noopener noreferrer">{patient.name}</a> */}
                                            </td>
                                            <td>{patient.email}</td>
                                            <td>
                                                {patient.telephone}
                                            </td>
                                            <td>
                                                {patient.gender}
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
// class PatientList extends Component {
//     constructor(props) {
//         super(props);        
//         document.title = "Patient List | AGP Dental Tool";

//         this.state = {
//             patients: [
//                 { name: "Herbert C. Patton", age: "20", gender: "Male", date: "5/12/2024" },
//                 { name: "Mathias N. Klausen", age: "32", gender: "Female", date: "10/11/2024" },
//                 { name: "Nikolaj S. Henriksen", age: "16", gender: "Male", date: "8/11/2024" },
//                 { name: "Lasse C. Overgaard", age: "45", gender: "Female", date: "7/11/2024" },
//                 { name: "Kasper S. Jessen", age: "54", gender: "Male", date: "1/11/2024" },
//             ],
//             breadcrumbItems : [
//                 { title: "AGP", link: "#" },
//                 { title: "Practice List", link: "#" },
//                 { title: "Patient List", link: "#" },
//               ]
//         }
//         props.setBreadcrumbItems('New Patient', this.state.breadcrumbItems)
//         this.handleButtonClick = this.handleButtonClick.bind(this);
//     }

//     handleButtonClick() {
//         <Navigate to={{ pathname: "/newPatient" }} />
//       }


//     render() {
//         return (
//             <React.Fragment>
//                 <Card>
//                     <CardBody>
//                         <h4 className="card-title mb-12">Patient List</h4>
//                         <Row>
//                             <Col sm={2}>
//                                 <Button type="button" onClick={this.handleButtonClick} color="primary" className="waves-effect waves-light">New Patient</Button>{" "}
//                                 <Button type="button" color="primary" className="waves-effect waves-light">Print</Button>
//                             </Col>

//                             <Col sm={1}>

//                             </Col>
//                             <Col sm={9}>

//                             </Col>
//                         </Row>
//                         <div className="table-responsive">
//                             <Table className="align-middle table-centered table-vertical table-nowrap">
//                                 <thead>
//                                     <tr>
//                                         <th>Name</th>
//                                         <th>Age</th>
//                                         <th>Gender</th>
//                                         <th>Date</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {
//                                         this.state.patients.map((patient, key) =>
//                                             <tr key={key}>
//                                                 <td>
//                                                     <a href="https://www.example.com" target="_blank" rel="noopener noreferrer">{patient.name}</a>
//                                                 </td>
//                                                 <td>{patient.age}</td>
//                                                 <td>
//                                                     {patient.gender}
//                                                 </td>
//                                                 <td>
//                                                     {patient.date}
//                                                 </td>
//                                             </tr>
//                                         )
//                                     }
//                                 </tbody>
//                             </Table>
//                         </div>
//                     </CardBody>
//                 </Card>
//             </React.Fragment>
//         );
//     }
// }

export default connect(null, { setBreadcrumbItems })(PatientList);