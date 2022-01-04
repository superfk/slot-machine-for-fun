import React from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";

class Wheel extends React.Component {
  render() {
    return (
        <TransitionGroup component="span">
        {/* Make sure this is inline-block */}
        <CSSTransition
          classNames="ctr"
          timeout={{ enter: 1000, exit: 300 }}
          key={Math.random()}
          unmountOnExit
        >
        {/* TODO: create speficic classes for inc and dec actions */}
          <span className="counter__value">{this.props.text}</span>
        </CSSTransition>
      </TransitionGroup>
    );
  }
}

export default Wheel;
