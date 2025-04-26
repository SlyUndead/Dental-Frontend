import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Card, CardBody, Button, UncontrolledTooltip } from "reactstrap";
import withRouter from 'components/Common/withRouter';
import { Link } from "react-router-dom"
import { setBreadcrumbItems } from "../store/actions";
import { connect } from "react-redux";
import { Navigate } from "react-router-dom";
import axios from 'axios';
import { logErrorToServer } from '../utils/logError';
const PracticeList = (props) => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    document.title = "Practice List | AGP Dental Tool";

    const breadcrumbItems = [
        { title: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, link: "/practiceList" },
        { title: "Practice Name", link: "#" }
    ]
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const [practices, setPractices] = useState([]);
    useEffect(() => {
        const getPracticeList = async () => {
            try {
                const response = await axios.get(`${apiUrl}/getPracticeList?clientId=` + sessionStorage.getItem('clientId'),
                    {
                        headers: {
                            Authorization: sessionStorage.getItem('token')
                        }
                    }); // Adjust the API endpoint as needed
                //    const getPracticeList= async()=>{const response = await axios.get('http://localhost:3001/getPracticeList');
                const data = response.data;
                sessionStorage.setItem('token', response.headers['new-token'])
                // setMainImage(data.image);
                // setAnnotations(data.annotations);
                setPractices(data.practiceList);
            }
            catch (error) {
                if (error.status === 403 || error.status === 401) {
                    sessionStorage.removeItem('token');
                    setRedirectToLogin(true);
                }
                else {
                    logErrorToServer(error, "getPracticeList");
                }
                //console.log(err);
            }
        }
        getPracticeList()
    }, [])
    useEffect(() => {
        props.setBreadcrumbItems('Practice List', breadcrumbItems)
    }, [])

    // const handleClick = () => {
    //     const { history } = this.props;
    //     history.push('/patientList'); // Redirects to /patientList
    // };

    const [redirect, setRedirect] = useState(false);
    const [redirectToNewPractice, setRedirectToNewPractice] = useState(false);
    const handleClick = (practiceName) => {
        //console.log('practice name : ' + practiceName.name)
        sessionStorage.setItem('practiceId', practiceName._id)
        sessionStorage.setItem('practiceName', practiceName.name)
        setRedirect(true);
    };

    const handleNewPracticeClick = () => {
        setRedirectToNewPractice(true);
    }
    const handleEditClick = (e, practice) => {
        // return <Navigate to="/login" />
        e.stopPropagation();
        sessionStorage.setItem('practiceName', practice.name);
        sessionStorage.setItem('practiceAddress', practice.address);
        sessionStorage.setItem('practiceTelephone', practice.contactNo);
        sessionStorage.setItem('practiceId', practice._id);
        setRedirectToNewPractice(true);
    }

    if (redirect) {
        return <Navigate to="/patientList" />;
    }
    if (redirectToLogin) {
        return <Navigate to="/login" />;
    }
    if (redirectToNewPractice) {
        return <Navigate to="/newPractice" />;
    }
    return (
        <React.Fragment>
            <Card>
                <CardBody>
                    <Row>
                        <Col sm={2}>
                            <Button type="button" onClick={() => { handleNewPracticeClick() }} color="primary" className="waves-effect waves-light">New Practice</Button>{" "}
                        </Col>

                    </Row><br></br>
                    <Row className="justify-content-center">
                        <Col sm={12}>
                            <div className="table-responsive">
                                <Table className="align-middle table-centered table-vertical table-nowrap table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Telephone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            practices.map((practice, key) =>
                                                <tr key={key} onClick={() => handleClick(practice)}>
                                                    <td>
                                                        {practice.name}
                                                    </td>
                                                    <td>{practice.address}</td>
                                                    <td>
                                                        {practice.contactNo}
                                                    </td>
                                                    <td><button
                                                        id="btnEdit"
                                                        type="button"
                                                        style={{ cssText: 'padding: 2px !important', fontSize: '25px' }}
                                                        className="btn"
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(e, practice) }}
                                                    >
                                                        <i className='mdi mdi-pencil-box-outline'></i>
                                                    </button>
                                                        <UncontrolledTooltip placement="bottom" target="btnEdit">Edit Practice
                                                        </UncontrolledTooltip>
                                                    </td>
                                                    {/* <td>
                                                            <Link to="/patientList" type="button" outline color="success" className="waves-effect waves-light">
                                                                <span>Select</span>
                                                            </Link>
                                                            <Button type="button" onClick={this.handleClick} outline color="success" className="waves-effect waves-light">Select</Button> 
                                                        </td>*/}
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </Table>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>
        </React.Fragment>
    );
}

export default connect(null, { setBreadcrumbItems })(PracticeList);