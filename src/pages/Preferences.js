import React, { useEffect,useState } from "react"

import { connect } from "react-redux";
import {
    Card,
    CardBody,
    Col,
    Row
} from "reactstrap"
//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../store/actions";

const Preferences = (props) => {
    document.title = "Preferences | AGP Dental Tool";

    const breadcrumbItems = [
        { title: "AGP", link: "#" },
        { title: "Practice List", link: "#" },
        { title: "Preferences", link: "#" },
    ]
    const [ipAdd, setipAdd] = useState('');

    useEffect(() => {
        props.setBreadcrumbItems('Preferences', breadcrumbItems)
        if (localStorage.getItem('apiIpAdd') !== null && localStorage.getItem('apiIpAdd') !== '')
            setipAdd(localStorage.getItem('apiIpAdd'));
    },[])

    const handleInputChange = (event) => {
        setipAdd(event.target.value);
    };
    const handleButtonClick = () => {
        localStorage.setItem('apiIpAdd', ipAdd);
        //console.log(localStorage.getItem('apiIpAdd'));
      };
      const handleResetClick = () => {
        setipAdd('');
        localStorage.removeItem('apiIpAdd');
        //console.log(localStorage.getItem('apiIpAdd'));
      };

    return (
        <React.Fragment>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <Row className="mb-3">
                                <label
                                    htmlFor="example-text-input"
                                    className="col-md-2 col-form-label"
                                >
                                    IP Address of API
                                </label>
                                <div className="col-md-10">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={ipAdd}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </Row>
                            <Row className="mb-3">
                                <div className="text-center mt-4">
                                <button onClick={handleResetClick}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Reset
                                    </button>
                                    &nbsp;&nbsp;&nbsp;&nbsp;
                                    <button onClick={handleButtonClick}
                                        type="button"
                                        className="btn btn-primary waves-effect waves-light"
                                    >
                                        Save
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

export default connect(null, { setBreadcrumbItems })(Preferences);