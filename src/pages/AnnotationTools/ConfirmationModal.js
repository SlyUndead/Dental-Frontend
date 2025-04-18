
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
const ConfirmationModal = ({ isOpen, toggle, onConfirm, message, onClose }) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Confirm Action</ModalHeader>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>No</Button>
        <Button color="primary" onClick={onConfirm}>Yes, Update</Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmationModal