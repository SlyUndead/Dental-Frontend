import React, { useEffect, useState } from 'react';
import { connect } from "react-redux";
//Import Action to copy breadcrumb items from local state to redux state
import { setBreadcrumbItems } from "../../store/actions";
import {
    Card, CardBody, CardTitle, Row, Col,
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Button
} from 'reactstrap';

const UiOffcanvas = (props) => {
    document.title = "Offcanvas | Lexa - Responsive Bootstrap 5 Admin Dashboard";

    const breadcrumbItems = [
        { title: "Lexa", link: "#" },
        { title: "UI Elements", link: "#" },
        { title: "Colors", link: "#" },
    ]

    useEffect(() => {
        props.setBreadcrumbItems('OffCanvas', breadcrumbItems)
    })

    const [open, setOpen] = useState(false);
    const [isTop, setIsTop] = useState(false);
    const [isRight, setIsRight] = useState(false);
    const [isEnableScroll, setIsEnableScroll] = useState(false);
    const [isBackdrop, setIsBackdrop] = useState(false);
    const [isScrollBackDrop, setIsScrollBackDrop] = useState(false);

    const toggleLeftCanvas = () => {
        setOpen(!open);
    };

    const toggleTopCanvas = () => {
        setIsTop(!isTop);
    };
    const toggleRightCanvas = () => {
        setIsRight(!isRight);
    };

    const toggleEnableScroll = () => {
        setIsEnableScroll(!isEnableScroll);
    };
    const toggleBackdrop = () => {
        setIsBackdrop(!isBackdrop);
    };
    const toggleScrollBackDrop = () => {
        setIsScrollBackDrop(!isScrollBackDrop);
    };

    return (
        <React.Fragment>

            <Row>
                <Col lg={6}>
                    <Card>
                        <CardBody>
                            <CardTitle as="h5">Demo</CardTitle>
                            <p className="card-title-desc">Use the buttons below to show and hide an offcanvas element via JavaScript that toggles the <code>.show</code> class on an element with the <code>.offcanvas</code> class.</p>

                            <div className="d-flex flex-wrap gap-2">
                                <Button
                                    color="primary"
                                    onClick={toggleLeftCanvas}
                                >
                                    Link with href
                                </Button>
                                <Button
                                    color="primary"
                                    type="button"
                                    onClick={toggleLeftCanvas}
                                >
                                    Button with data-bs-target
                                </Button>
                            </div>

                            <Offcanvas isOpen={open} toggle={toggleLeftCanvas}>
                                <OffcanvasHeader toggle={toggleLeftCanvas}>
                                    <h5 className="offcanvas-title" id="offcanvasExampleLabel">Offcanvas</h5>
                                </OffcanvasHeader>
                                <OffcanvasBody>
                                    <div>
                                        Some text as placeholder. In real life you can have the elements you have chosen. Like, text, images, lists, etc.
                                    </div>
                                    <UncontrolledDropdown className="mt-3">
                                        <DropdownToggle color="secondary" type="button">
                                            Dropdown button
                                            <i className="mdi mdi-chevron-down"></i>
                                        </DropdownToggle>
                                        <DropdownMenu>
                                            <DropdownItem>Action</DropdownItem>
                                            <DropdownItem>Another action</DropdownItem>
                                            <DropdownItem>Something else here</DropdownItem>
                                        </DropdownMenu>
                                    </UncontrolledDropdown>
                                </OffcanvasBody>
                            </Offcanvas>
                        </CardBody>
                    </Card>

                </Col>


                <Col lg={6}>
                    <Card>
                        <CardBody>
                            <h5 className="card-title">Placement</h5>
                            <p className="card-title-desc">Offcanvas Diffrent Placement Example: Left & Right</p>

                            <div className="d-flex flex-wrap gap-2">
                                <Button
                                    color="primary"
                                    onClick={toggleTopCanvas}
                                >
                                    Toggle right offcanvas
                                </Button>

                                <Button
                                    color="primary"
                                    onClick={toggleRightCanvas}
                                >
                                    Toggle bottom offcanvas
                                </Button>
                            </div>
                            <Offcanvas
                                isOpen={isTop}
                                direction="top"
                                toggle={toggleTopCanvas}>
                                <OffcanvasHeader toggle={toggleTopCanvas}>
                                    Offcanvas Top
                                </OffcanvasHeader>
                                <OffcanvasBody>
                                    ...
                                </OffcanvasBody>
                            </Offcanvas>
                            {/* Right offcanvas */}
                            <Offcanvas
                                isOpen={isRight}
                                direction="end"
                                toggle={toggleRightCanvas}>
                                <OffcanvasHeader toggle={toggleRightCanvas}>
                                    Offcanvas Right
                                </OffcanvasHeader>
                                <OffcanvasBody>
                                    ...
                                </OffcanvasBody>
                            </Offcanvas>
                        </CardBody>

                    </Card>

                </Col>

            </Row>


            <Row>
                <Col lg={12}>
                    <Card>
                        <CardBody>
                            <CardTitle as="h5">Backdrop</CardTitle>
                            <p className="card-title-desc">Scrolling the <code>&lt;body&gt;</code> element is disabled when an offcanvas and its backdrop are visible. Use the <code>data-bs-scroll</code> attribute to toggle <code>&lt;body&gt;</code> scrolling and <code>data-bs-backdrop</code> to toggle the backdrop.</p>

                            <div className="d-flex flex-wrap gap-2">
                                <Button
                                    color="primary"
                                    onClick={toggleEnableScroll}
                                >
                                    Enable body scrolling
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={toggleBackdrop}
                                >
                                    Enable backdrop (default)
                                </Button>
                                <Button
                                    color="primary"
                                    onClick={toggleScrollBackDrop}
                                >
                                    Enable both scrolling & backdrop
                                </Button>
                            </div>

                            <Offcanvas
                                isOpen={isEnableScroll}
                                scrollable
                                backdrop={false}
                                toggle={toggleEnableScroll}>
                                <OffcanvasHeader toggle={toggleEnableScroll}>
                                    Colored with scrolling
                                </OffcanvasHeader>
                                <OffcanvasBody>
                                    <p>
                                        Try scrolling the rest of the page to see this option in action.
                                    </p>
                                </OffcanvasBody>
                            </Offcanvas>

                            <Offcanvas
                                isOpen={isBackdrop}
                                toggle={toggleBackdrop}>
                                <OffcanvasHeader toggle={toggleBackdrop}>
                                    Offcanvas with backdrop
                                </OffcanvasHeader>
                                <OffcanvasBody>
                                    <p>.....</p>
                                </OffcanvasBody>
                            </Offcanvas>

                            <Offcanvas
                                isOpen={isScrollBackDrop}
                                scrollable
                                toggle={toggleScrollBackDrop}>
                                <OffcanvasHeader toggle={toggleScrollBackDrop}>
                                    Backdroped with scrolling
                                </OffcanvasHeader>
                                <OffcanvasBody>
                                    <p>
                                        Try scrolling the rest of the page to see this option in action.
                                    </p>
                                </OffcanvasBody>
                            </Offcanvas>
                        </CardBody>
                    </Card>

                </Col>

            </Row>


        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(UiOffcanvas);
