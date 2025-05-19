import React, { useState, useEffect } from "react";
import { Button, Input, Table, UncontrolledTooltip, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { logErrorToServer } from "utils/logError";

const ConfidenceLevelPage = () => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    const [confidenceLevels, setConfidenceLevels] = useState([]);
    const [redirectToLogin, setRedirectToLogin] = useState(false);
    const [redirectToAnnotationPage, setRedirectToAnnotationPage] = useState(false);
    const [activeTab, setActiveTab] = useState('pano');

    // Define image groups
    const imageGroups = [
        { id: 'pano', name: 'Panoramic' },
        { id: 'bitewing', name: 'Bitewing' },
        { id: 'pariapical', name: 'Pariapical' },
        { id: 'ceph', name: 'Cephalometric' },
        { id: 'intraoral', name: 'Intraoral' }
    ];

    useEffect(() => {
        const fetchClassCategories = async () => {
            if (sessionStorage.getItem('clientId') === '67161fcbadd1249d59085f9a') {
                try {
                    const response = await axios.get(`${apiUrl}/get-classCategories?clientId=` + sessionStorage.getItem('clientId'),
                        {
                            headers: {
                                Authorization: sessionStorage.getItem('token')
                            }
                        });
                    const data = response.data;
                    sessionStorage.setItem('token', response.headers['new-token']);
                    setConfidenceLevels(data);
                } catch (error) {
                    if (error.status === 403 || error.status === 401) {
                        sessionStorage.removeItem('token');
                        setRedirectToLogin(true);
                    }
                    else {
                        logErrorToServer(error, "initial useEffect");
                        console.error('Error fetching confidence levels:', error);
                    }
                }
            }
            else {
                setRedirectToLogin(true);
            }
        };
        fetchClassCategories();
    }, [apiUrl]);

    const handleValueChange = async (item, newValue, group) => {
        try {
            // Build the API endpoint with the appropriate parameters
            let endpoint = `${apiUrl}/edit-className?id=${item._id}&confidence=${newValue / 100.0}&group=${group}`;

            const response = await axios.post(endpoint, {}, {
                headers: {
                    Authorization: sessionStorage.getItem('token')
                }
            });

            sessionStorage.setItem('token', response.headers['new-token']);

            // Update the state based on which confidence level was changed
            setConfidenceLevels((prevLevels) => {
                return prevLevels.map((i) => {
                    if (i._id === item._id) {
                        const updatedItem = { ...i };
                        updatedItem[`${group}_confidence`] = newValue / 100.0;
                        return updatedItem;
                    }
                    return i;
                });
            });
        } catch (error) {
            if (error.status === 403 || error.status === 401) {
                sessionStorage.removeItem('token');
                setRedirectToLogin(true);
            }
            else {
                logErrorToServer(error, "handleValueChange");
                console.error('Error updating confidence level:', error);
            }
        }
    };

    // Helper function to get the confidence value for a specific group
    const getConfidenceValue = (item, group) => {
        const fieldName = `${group}_confidence`;
        // Use the group-specific confidence value or default to 1 if not set
        return (item[fieldName] * 100.0) || 1;
    };

    if (redirectToLogin) {
        return <Navigate to='/login' />;
    }

    if (redirectToAnnotationPage) {
        return <Navigate to="/annotationPage" />;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Confidence Level Settings</h2>
                <Button
                    id="navigateToAnnotationPage"
                    color="primary"
                    onClick={() => setRedirectToAnnotationPage(true)}
                >
                    Annotation Page
                </Button>
                <UncontrolledTooltip target={"navigateToAnnotationPage"}>Go To AnnotationPage</UncontrolledTooltip>
            </div>

            <div className="mb-3">
                <p>Set different confidence levels for each image group. Each group has its own specific confidence level settings.</p>
            </div>

            <Nav tabs>
                {imageGroups.map(group => (
                    <NavItem key={group.id}>
                        <NavLink
                            className={activeTab === group.id ? 'active' : ''}
                            onClick={() => setActiveTab(group.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            {group.name}
                        </NavLink>
                    </NavItem>
                ))}
            </Nav>

            <TabContent activeTab={activeTab} className="mt-3">
                {imageGroups.map(group => (
                    <TabPane key={group.id} tabId={group.id}>
                        <Table striped>
                            <thead>
                                <tr>
                                    <th>Class Name</th>
                                    <th>Category</th>
                                    <th>Confidence Level % (1-100)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {confidenceLevels.map((item) => (
                                    <tr key={`${item._id}-${group.id}`}>
                                        <td>{item.className}</td>
                                        <td>{item.category}</td>
                                        <td>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={getConfidenceValue(item, group.id)}
                                                onChange={(e) => {
                                                    e.preventDefault();
                                                    handleValueChange(item, e.target.value, group.id);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </TabPane>
                ))}
            </TabContent>
        </div>
    );
};

export default ConfidenceLevelPage;