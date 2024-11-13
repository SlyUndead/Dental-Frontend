import React, { useEffect, useState, useRef } from 'react';
import { Table, Card, CardBody, Button, Col, Row } from "reactstrap";
import { Navigate } from "react-router-dom";
import { setBreadcrumbItems } from "../store/actions";
import { connect } from "react-redux";
import axios from 'axios';
const PatientList = (props) => {
    const printRef = useRef();

    document.title = "Patients List | AGP Dental Tool";
    const breadcrumbItems = [
        { title: "AGP", link: "#" },
        { title: sessionStorage.getItem('practiceName'), link: "/practiceList" },
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
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    useEffect(() => {
        const practiceId = sessionStorage.getItem('practiceId');
        const getPatientList = async () => {
            const response = await axios.get(`${apiUrl}/getPatient?practiceId=` + practiceId,
                {
                  headers:{
                    Authorization:sessionStorage.getItem('token')
                  }
                }); // Adjust the API endpoint as needed
                if(response.status===403){
                    sessionStorage.removeItem('token');
                    setRedirectToLogin(true);
                }
            //const getPatientList= async()=>{const response = await axios.get('http://localhost:3001/getPatient?practiceId=' + practiceId); 
            const data = response.data;
            setPatients(data.patientList);
        }

        getPatientList()
    }, [])

    const handleClickNewPatient = () => {
        setRedirect(true);
    };
    if(redirectToLogin){
        return <Navigate to="/login"/>
    }
    if (redirect) {
        return <Navigate to="/newPatient" />;
    }

    const handleClick = (patientId, firstName, lastName) => {
        //console.log(patinetId);
        sessionStorage.setItem('patientId', patientId);
        const fullName = `${firstName} ${lastName}`
        sessionStorage.setItem('patientName', fullName);
        setRedirectToImages(true);
    };

    const handlePrint = () => {
        const practiceName = sessionStorage.getItem('practiceName') 
        const printWindow = window.open('', '_blank');

        const styles = Array.from(document.styleSheets).map((styleSheet) => {
            try {
               const rules = Array.from(styleSheet.cssRules)
          .filter(rule => {
            // Ignore table hover styles
            return !rule.selectorText || !rule.selectorText.includes(':hover');
          })
          .map(rule => rule.cssText)
          .join('\n');
        return `<style>${rules}</style>`;
            } catch (e) {
                // Handle CORS issues if styleSheet is from another domain
                return '';
            }
        }).join('\n');

        printWindow.document.write(`
      <html>
        <head>
          <title></title>
          ${styles}
           <style>
           body {
              font-family: Arial, sans-serif;
              text-align: center; /* Centering text in the body */
            }
            .center {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              margin: 20px 0; /* Add some margin if needed */
            }

            @media print {
              @page {
                margin: 10; /* Adjust margins if necessary */
              }
              /* Add any other styles you want for printing */
              footer, header {
                display: none !important; /* Hide headers and footers */
              }
            }
          </style>
        </head>
        <body>
        <div  class="center">
         ${practiceName}
        </div>
        <div>
          ${printRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
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
                            <Button type="button" color="primary" className="waves-effect waves-light" onClick={handlePrint}>Print</Button>
                        </Col>
                    </Row>
                    <div className="table-responsive" ref={printRef}>
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
                                        <tr key={key} onClick={() => handleClick(patient._id, patient.first_name, patient.last_name)}>
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