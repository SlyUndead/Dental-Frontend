import React , {useEffect} from 'react';
import { connect } from "react-redux";
//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../../store/actions";
import { Card, CardBody, CardTitle, Col, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

const UiColors = (props) => {
    document.title = "Colors | Lexa - Responsive Bootstrap 5 Admin Dashboard";

    const breadcrumbItems = [
        { title: "Lexa", link: "#" },
        { title: "UI Elements", link: "#" },
        { title: "Colors", link: "#" },
    ]

    useEffect(() => {
        props.setBreadcrumbItems('Colors', breadcrumbItems)
    })
    return (
        <>
            <Row>
                <Col xl={6}>
                    <Card>
                        <CardBody>
                            <CardTitle as="h4">Text Colors</CardTitle>
                            <p className="card-title-desc">
                                Colorize text with color utilities. If you want to colorize links, you can use
                                the .link-* helper classes which have <code>:hover</code> and <code>:focus</code> states.</p>
                            <div>
                                <p className="text-primary">text-primary</p>
                                <p className="text-secondary">text-secondary</p>
                                <p className="text-success">text-success</p>
                                <p className="text-danger">text-danger</p>
                                <p className="text-warning bg-dark">text-warning</p>
                                <p className="text-info bg-dark">text-info</p>
                                <p className="text-white bg-dark">text-light</p>
                                <p className="text-reset">text-dark</p>
                                <p className="text-body">text-body</p>
                                <p className="text-muted">text-muted</p>
                                <p className="text-white bg-dark">text-white</p>
                                <p className="text-black-50">text-black-50</p>
                                <p className="text-white-50 bg-dark">text-white-50</p>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card>
                        <CardBody>
                            <CardTitle as="h4">Background Colors</CardTitle>
                            <p className="card-title-desc">Similar to the contextual text color classes, set the background of an element to any contextual class. Background utilities <strong>do not set <code>color</code></strong>,
                                so in some cases you’ll want to use <code>.text-*</code> <Link to="/docs/5.2/utilities/colors/">color utilities</Link>.</p>

                            <div>
                                <div className="p-2 mb-2 bg-primary text-white">bg-primary</div>
                                <div className="p-2 mb-2 bg-secondary text-white">bg-secondary</div>
                                <div className="p-2 mb-2 bg-success text-white">bg-success</div>
                                <div className="p-2 mb-2 bg-danger text-white">bg-danger</div>
                                <div className="p-2 mb-2 bg-warning text-white">bg-warning</div>
                                <div className="p-2 mb-2 bg-info text-white">bg-info</div>
                                <div className="p-2 mb-2 bg-light text-reset">bg-light</div>
                                <div className="p-2 mb-2 bg-dark text-white">bg-dark</div>
                                <div className="p-2 mb-2 bg-body text-reset">bg-body</div>
                                <div className="p-2 mb-2 bg-white text-reset">bg-white</div>
                                <div className="p-2 mb-2 bg-transparent text-reset">bg-transparent</div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>


            <Row>
                <Col xl={6}>
                    <Card>
                        <CardBody>
                            <CardTitle as="h4" className="mb-3">Background RGBA Colors</CardTitle>
                            <div>
                                <div className="p-2 mb-2 bg-primary-subtle text-primary">bg-primary</div>
                                <div className="p-2 mb-2 bg-secondary-subtle text-secondary">bg-secondary</div>
                                <div className="p-2 mb-2 bg-success-subtle text-success">bg-success</div>
                                <div className="p-2 mb-2 bg-danger-subtle text-danger">bg-danger</div>
                                <div className="p-2 mb-2 bg-warning-subtle text-warning">bg-warning</div>
                                <div className="p-2 mb-2 bg-info-subtle text-info">bg-info</div>
                                <div className="p-2 mb-2 bg-light-subtle text-reset">bg-light</div>
                                <div className="p-2 mb-2 bg-dark-subtle text-reset">bg-dark</div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card>
                        <CardBody>
                            <CardTitle as="h4" className="mb-3">Background Gradient Colors</CardTitle>
                            <div>
                                <div className="p-2 mb-2 bg-gradient bg-primary text-white">bg-primary</div>
                                <div className="p-2 mb-2 bg-gradient bg-secondary text-white">bg-secondary</div>
                                <div className="p-2 mb-2 bg-gradient bg-success text-white">bg-success</div>
                                <div className="p-2 mb-2 bg-gradient bg-danger text-white">bg-danger</div>
                                <div className="p-2 mb-2 bg-gradient bg-warning text-white">bg-warning</div>
                                <div className="p-2 mb-2 bg-gradient bg-info text-white">bg-info</div>
                                <div className="p-2 mb-2 bg-gradient bg-light text-reset">bg-light</div>
                                <div className="p-2 mb-2 bg-gradient bg-dark text-white">bg-dark</div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>


            <Row>
            <Col xl={6}>
                    <Card>
                        <CardBody>
                            <h4 className="card-title">Text Opacity Colors</h4>
                            <p className="card-title-desc">To change that opacity, override <code>--bs-text-opacity</code> via custom styles or inline styles.</p>

                            <div>
                                <p className="text-primary">This is default primary text</p>
                                <p className="text-primary text-opacity-75">This is 75% opacity primary text</p>
                                <p className="text-primary text-opacity-50">This is 50% opacity primary text</p>
                                <p className="text-primary text-opacity-25 mb-0">This is 25% opacity primary text</p>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col xl={6}>
                    <Card>
                        <CardBody>
                            <h4 className="card-title">Background Opacity Colors</h4>
                            <p className="card-title-desc">Or, choose from any of the <code>.bg-opacity</code> utilities:</p>

                            <div>
                                <div className="bg-success p-2 text-white">This is default success background</div>
                                <div className="bg-success p-2 text-white bg-opacity-75">This is 75% opacity success background</div>
                                <div className="bg-success p-2 text-reset bg-opacity-50">This is 50% opacity success background</div>
                                <div className="bg-success p-2 text-reset bg-opacity-25">This is 25% opacity success background</div>
                                <div className="bg-success p-2 text-reset bg-opacity-10">This is 10% opacity success background</div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>


        </>
    )
}

export default connect(null, { setBreadcrumbItems })(UiColors);
