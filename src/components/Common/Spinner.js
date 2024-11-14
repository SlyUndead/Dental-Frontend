import React, { useEffect } from "react"
import { Spinner } from "reactstrap";

const Spinners = ({ setLoading }) => {

    useEffect(() => {
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }, [setLoading]);
    return (
        <React.Fragment>
            <Spinner color="primary" className='position-absolute top-50 start-50' />
        </React.Fragment>
    )
}

export default Spinners;