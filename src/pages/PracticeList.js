import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Card, CardBody, Button } from "reactstrap";
import withRouter from 'components/Common/withRouter';
import { Link } from "react-router-dom"
import { setBreadcrumbItems } from "../store/actions";
import { connect } from "react-redux";
import { Navigate } from "react-router-dom";
import axios from 'axios';
const PracticeList = (props) => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    document.title = "Practice List | AGP Dental Tool";

    const breadcrumbItems = [
        { title: "AGP", link: "#" },
        { title: "Practice List", link: "#" }
    ]

    const [practices, setPractices] = useState([]);
    useEffect(() => {
        console.log(apiUrl);
        const getPracticeList = async () => {
            const response = await axios.get(`${apiUrl}/getPracticeList`); // Adjust the API endpoint as needed
            //    const getPracticeList= async()=>{const response = await axios.get('http://localhost:3001/getPracticeList');
            console.log(response);
            const data = response.data;
            // setMainImage(data.image);
            // setAnnotations(data.annotations);
            setPractices(data.practiceList);
        }
        getPracticeList()
    }, [])
    useEffect(() => {
        props.setBreadcrumbItems('PracticeList', breadcrumbItems)
    }, [])

    // const handleClick = () => {
    //     const { history } = this.props;
    //     history.push('/patientList'); // Redirects to /patientList
    // };

    const [redirect, setRedirect] = useState(false);

    const handleClick = (practiceName) => {
        //console.log('practice name : ' + practiceName.name)
        sessionStorage.setItem('practiceId', practiceName._id)
        setRedirect(true);
    };

    if (redirect) {
        return <Navigate to="/patientList" />;
    }

    return (
        <React.Fragment>
            <Card>
                <CardBody>
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