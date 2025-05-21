import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Form, Input, Button } from 'reactstrap';
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-light.png";
import logo3 from "../../assets/images/logo3.png"
import logo4 from "../../assets/images/logo4.png"
import logo5 from "../../assets/images/logo5.png"
import logo7 from "../../assets/images/logo7.png"
import logo8 from "../../assets/images/OralWisdom-NewLogo-01.png"
import dentalLaser from "../../assets/images/PX/Dental Laser.png"
import surgicalMicroscope from "../../assets/images/PX/Surgical Microscope.png"
import dentalServices from "../../assets/images/PX/Dental Services.png"
import toothExtraction from "../../assets/images/PX/Tooth Extraction.png"
// import { useSelector, useDispatch } from "react-redux";
// import { createSelector } from "reselect";
// import PropTypes, { resetWarningCache } from "prop-types";
import { Navigate } from "react-router-dom";
// Formik validation
//import * as Yup from "yup";
//import { useFormik } from "formik";
// import withRouter from 'components/Common/withRouter';
import { AvForm, AvField } from "availity-reactstrap-validation"
// actions
//import { loginUser, socialLogin, loginSuccess } from "../../store/actions";
import axios from "axios"
import { logErrorToServer } from '../../utils/logError';
const Login = props => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  document.title = "Login | AGP Dental Tool";
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(true);
  //const dispatch = useDispatch();

  // Check if token exists and is valid
  useEffect(() => {
    const token = sessionStorage.getItem('token');

    const validateToken = async () => {
      if (token) {
        try {
          // Use an existing protected endpoint to validate the token
          // We'll use the getCDTCodes endpoint which requires authentication
          const response = await axios.get(`${apiUrl}/getCDTCodes`, {
            headers: {
              Authorization: `${token}`
            }
          });

          // If the request is successful, the token is valid
          if (response.status === 200) {
            setRedirect(true);
          }
        } catch (error) {
          // If there's an error, the token is invalid or expired
          // Clear the session storage
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('clientId');
          sessionStorage.removeItem('firstName');
          sessionStorage.removeItem('lastName');
        }
      }
      // Set loading to false regardless of whether there's a token or not
      setLoading(false);
    };

    validateToken();
  }, [apiUrl])
  //-----------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      //console.log("calling api");
      const response = await axios.post(`${apiUrl}/login`, {
        username: username, password: password
      });
      // console.log(response);
      if (response.status === 200) {
        //console.log(response);
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('clientId', response.data.clientId);
        sessionStorage.setItem('firstName', response.data.firstName);
        sessionStorage.setItem('lastName', response.data.lastName);
        // localStorage.setItem('authUser',response.data.token);
        setError('');
        setRedirect(true);
      }
      else
        throw new Error(response.data || 'Login failed');
    }
    catch (error) {
      console.log(error);
      if (error instanceof Error) {
        setError(error?.response?.data || 'Login failed');
      } else {
        setError(process.env.REACT_APP_ERRORMSG);
      }
      await logErrorToServer(error, "handleSubmit");
    }
  }

  if (redirect) {
    return <Navigate to="/practiceList" />;
  }

  // Show loading spinner while validating token
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="login-page d-flex align-items-center vh-100">
        <Container fluid className="h-100">
          <Row className="justify-content-center h-100">
            {/* Left Section - Logo & AI Dental Care */}
            <Col md={7} className="left-section d-flex flex-column justify-content-center" style={{ color: '#1B69B2' }}>
              <div className="text-start h-100 overflow-auto">
                {/* Add Your Logo Here */}
                <img src={logo8} alt="Logo" className="mb-3" style={{maxWidth: '50%', height: 'auto'}} />
                <h2 className="mt-3" style={{ fontSize: '32px', marginLeft: '5%', color: '#000' }}>Smarter dental care, powered by AI wisdom.</h2><br />
                <p className="mt-2" style={{ fontSize: '28px', marginLeft: '5%', color:'#000' }}>Enhancing diagnostics, optimizing workflows, and improving patient outcomes with AI-driven solutions.</p><br />
                <ul className="list-unstyled" style={{ fontSize: '24px', marginLeft: '5%' }}>
                  <li><img src={dentalLaser} style={{maxWidth: '10%', height: 'auto', marginRight: '10px'}} /> <strong>Efficiency</strong> - Automating diagnostics, treatment planning, and workflows</li>
                  <li><img src={surgicalMicroscope} style={{maxWidth: '10%', height: 'auto', marginRight: '10px'}} /> <strong>Accuracy</strong> - Reducing errors in dental assessments</li>
                  <li><img src={dentalServices} style={{maxWidth: '10%', height: 'auto', marginRight: '10px'}} /> <strong>Seamless Integration</strong> - Embedding AI wisdom into dental workflows</li>
                  <li><img src={toothExtraction} style={{maxWidth: '10%', height: 'auto', marginRight: '10px'}} /> <strong>Trust & Compliance</strong> - Ensuring transparency for dentists and insurers</li>
                </ul>
              </div>
            </Col>

            {/* Right Section - Login Form */}
            <Col md={5} className="d-flex align-items-center justify-content-center">
              <Card className="login-card shadow-lg p-5">
                <CardBody>
                  <h3 className="text-center" style={{ fontSize: '28px', marginBottom: '20px' }}>Sign in</h3>
                  <p className="text-muted text-center">
                    Don't have an account? <Link to="/signup" style={{ color: '#F61569' }}>Sign up</Link>
                  </p>
                  {error&&<p className="text-center" style={{color:'red'}}>{error}</p>}

                  <Form className="mt-3" onSubmit={(e) => handleSubmit(e)}>
                    <div className="mb-4">
                      <Input
                        name="email"
                        type="email"
                        value={username}
                        className="form-control form-control-lg"
                        placeholder="Enter email"
                        required
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ fontSize: '16px', padding: '12px 15px' }}
                      />
                    </div>

                    <div className="mb-4">
                      <Input
                        name="password"
                        type="password"
                        value={password}
                        className="form-control form-control-lg"
                        placeholder="Enter Password"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ fontSize: '16px', padding: '12px 15px' }}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="rememberMe" style={{ transform: 'scale(1.2)' }} />
                        <label className="form-check-label" htmlFor="rememberMe" style={{ fontSize: '16px', marginLeft: '5px' }}>Keep me logged in</label>
                      </div>
                      <Link to="/forgot-password" className="text-muted" style={{ color: '#F61569', fontSize: '16px' }}>Forgot password?</Link>
                    </div>

                    <Button color="primary" block type='submit' style={{ fontSize: '18px', padding: '12px', marginTop: '10px' }}>Log in</Button>
                  </Form>

                  <div className="text-center mt-5">
                    <p className="text-muted" style={{ fontSize: '16px' }}>Or continue with</p>
                    <div className="d-flex justify-content-center">
                      <Button color="light" className="social-btn me-3">
                        <i className="mdi mdi-google"></i>
                      </Button>
                      <Button color="light" className="social-btn me-3">
                        <i className="mdi mdi-facebook"></i>
                      </Button>
                      <Button color="light" className="social-btn">
                        <i className="mdi mdi-apple"></i>
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

            </Col>
          </Row>
        </Container>

        {/* Custom Styles */}
        <style>{`
        .login-page {
          background-color: white;
        }
        .left-section {
          background: white;
          max-height: 100vh;
          overflow-y: auto;
          color: #F61569;
          text-align: center;
          padding: 40px;
        }
        .brand-logo-img {
          height: 100px;
          width: 300px;
        }
        .brand-logo {
          font-size: 32px;
          font-weight: bold;
        }
        .login-card {
          width: 100%;
          max-width: 500px;
          border-radius: 10px;
          background-color: #D3D3D3;
          padding: 20px;
        }
        .social-btn {
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        @media (max-height: 768px) {
          .left-section h2 {
            font-size: 24px !important;
          }
          .left-section p {
            font-size: 20px !important;
          }
          .left-section ul {
            font-size: 18px !important;
          }
        }
      `}</style>
      </div>

    </React.Fragment>
  )
}

export default Login;

// Login.propTypes = {
//   history: PropTypes.object,
// };
