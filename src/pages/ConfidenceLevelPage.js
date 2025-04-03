import React, {useState, useEffect} from "react";
import { Button, Input, Table, UncontrolledTooltip } from "reactstrap";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { logErrorToServer } from "utils/logError";
const ConfidenceLevelPage = () => {
    const apiUrl = process.env.REACT_APP_NODEAPIURL
    const [confidenceLevels, setConfidenceLevels] = useState([])
    const [redirectToLogin, setRedirectToLogin] = useState(false)
    const [redirectToAnnotationPage, setRedirectToAnnotationPage] = useState(false)
    useEffect(()=>{
    
        const fetchClassCategories = async() =>{
        if(sessionStorage.getItem('clientId') === '67161fcbadd1249d59085f9a'){
        try{
            const response = await axios.get(`${apiUrl}/get-classCategories?clientId=`+sessionStorage.getItem('clientId'),
        {
          headers:{
            Authorization:sessionStorage.getItem('token')
          }
        }); // Adjust the API endpoint as needed
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      setConfidenceLevels(data)
        } catch (error) {
            if(error.status===403||error.status===401){
            sessionStorage.removeItem('token');
            setRedirectToLogin(true);
            }
            else{
            logErrorToServer(error, "initial useEffect");
            console.error('Error fetching most recent image:', error);
            }
        }
        }
        else{
            setRedirectToLogin(true)
        }
    }
    fetchClassCategories()
    },[])

    const handleValueChange = async(item, newValue) => {
        try{
        const response = await axios.post(`${apiUrl}/edit-className?id=`+item._id+`&confidence=`+(newValue/100.0),
        {},
        {
          headers:{
            Authorization:sessionStorage.getItem('token')
          }
        }); // Adjust the API endpoint as needed
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      setConfidenceLevels((prevLevels) =>
        prevLevels.map((i) => (i._id === item._id ? { ...i, confidence: (newValue/100.0) } : i))
    );
      } catch (error) {
            if(error.status===403||error.status===401){
              sessionStorage.removeItem('token');
              setRedirectToLogin(true);
              }
              else{
              logErrorToServer(error, "handleValueChange");
              console.error('Error fetching most recent image:', error);
              }
            }
    }
    if(redirectToLogin){
        return(
        <Navigate to='/login'/>
        )
    }
    if(redirectToAnnotationPage){
        return(
            <Navigate to="/annotationPage"/>
        )
    }
    return(
        <>
        <Button 
            id="navigateToAnnotationPage"
            color="primary"
            onClick={()=>setRedirectToAnnotationPage(true)}
            >
                Annotation Page
            </Button>
            <UncontrolledTooltip target={"navigateToAnnotationPage"}>Go To AnnotationPage</UncontrolledTooltip>
        <Table>
            <thead>
                <tr>
                    <th>
                        Name
                    </th>
                    <th>
                        Confidence Level
                    </th>
                </tr>
            </thead>
            <tbody>
                {confidenceLevels.map((item) => (
                <tr key={item._id}>
                    <td>{item.className}</td>
                    <td>
                        <Input
                            type="number"
                            value={(item.confidence*100.0) || 1}
                            onChange={(e) => {e.preventDefault();handleValueChange(item, e.target.value)}}
                        />
                    </td>
                </tr>
            ))}
            </tbody>
        </Table>
        </>
    )
}

export default ConfidenceLevelPage