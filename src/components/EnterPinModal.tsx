import React from 'react';
import { Button, Modal, ModalHeader, ModalFooter, ModalBody } from 'reactstrap';
import api from '../api'
import './EnterPinModal.css';
import { AppState, notNull } from '../store';
import { connect } from 'react-redux';
import { toggleDeviceUnlockModal } from '../store/modal'
import { LoadingButton } from './Toolbox';
import { selectActiveWallet } from '../store/wallet';
import { Wallet } from '../types';


const digits = [
  [7,8,9],
  [4,5,6],
  [1,2,3],
]

interface StateProps {
  open: boolean;
  activeWallet: Wallet | null;
}

interface DispatchProps {
  // toggleDeviceUnlockModal: typeof toggleDeviceUnlockModal;
  toggleDeviceUnlockModal: any;  // FIXME
}

type Props = StateProps & DispatchProps

interface State {
  pin: string;
  pending: boolean;
  error: string | null;
  pressed: number | null;
}

// TODO: move to redux?
const initialState = {
  pin: '',
  pending: false,
  error: null,
  pressed: null,
};

class EnterPinModal extends React.Component<Props, State> {
  state: State = initialState;

  async enterPin() {
    const { pin, pending } = this.state;
    if (this.props.activeWallet && !pending) {
      try {
        this.setState({ pending: true })
        await api.enterPin({ pin });
        this.toggle()
      } catch(error) {
        this.setState({ 
          error: error.message,
          pin: '',
          pending: false,
         });
        // setTimeout(api.promptPin, 1000);
        api.promptPin({ wallet_name: this.props.activeWallet.name })
      }
    }
  }

  // FIXME: does this help?
  // async componentWillUnmount() {
  //   await api.deletePrompt()
  // }

  handlePinClick(digit: number) {
    if (!this.state.pending) {
      this.setState({ pin: this.state.pin + String(digit) });
    }
  }

  backspace() {
    if (!this.state.pending) {
      const oldPin = this.state.pin
      if (oldPin.length > 0) {
        const pin = oldPin.substring(0, oldPin.length - 1);
        this.setState({ pin });
      }
    }
  }

  renderPin() {
    const { pin } = this.state;
    return (
      <div className="PinModal-pins">
        {digits.map((row, idx) => (
          <div className="PinModal-pins-row" key={idx}>
            {row.map((digit) => (
              <div
                className="PinModal-pins-pin"
                key={digit}
                onClick={() => this.handlePinClick(digit)}
              />
            ))}
          </div>
        ))}
        <div>PIN: {"•".repeat(pin.length)}</div>
      </div>
    )
  }

  toggle() {
    this.setState(initialState)
    this.props.toggleDeviceUnlockModal();
  }

  componentWillUnmount() {
    api.deletePrompt();
  }

  renderError() {
    const style = {
      color: 'red',
    } 
    const { error } = this.state;
    if (error) {
      return <div style={style}>{error}</div>
    }
  }

  renderFooter() {
    const { pending } = this.state;
    return (
      <ModalFooter>
        {this.renderError()}
        <Button color="danger" onClick={this.backspace.bind(this)}>
          Backspace
        </Button>
        <LoadingButton loading={pending} color="secondary" onClick={this.enterPin.bind(this)}>
          Submit
        </LoadingButton>
      </ModalFooter>
    )
  }

  render() {
    const { open, activeWallet } = this.props;

    if (!activeWallet) {
      return <div></div>
    }

    return (
			<Modal isOpen={open} toggle={this.toggle.bind(this)} className="PinModal">
				<ModalHeader toggle={this.toggle.bind(this)}>EnterPin</ModalHeader>
				<ModalBody>
          {this.renderPin()}
				</ModalBody>
        {this.renderFooter()}
			</Modal>
		)
	}
}

export const mapStateToProps = (state: AppState) => {
  return {
    // FIXME: this can't assume active wallet isn't null b/c always mounts
    activeWallet: selectActiveWallet(state),
    open: state.modal.deviceUnlock.open,
  }
}

export default connect(
  mapStateToProps,
  { toggleDeviceUnlockModal },
)(EnterPinModal);