import './App.css';
import { useCallback, useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

function App() {

  const [persons, setpersons] = useState([]);

  const [targetWinner, settargetWinner] = useState({})
  const [winner, setwinner] = useState({ wheel1: '', wheel2: '', wheel3: '' })
  const [targetDepart, settargetDepart] = useState('')
  const [spinning, setspinning] = useState(false);
  const [counters, setcounters] = useState({ wheel1: 0, wheel2: 0, wheel3: 0 });
  const [winners, setwinners] = useState([]);

  // websocket
  const [socketUrl, setSocketUrl] = useState('ws://127.0.0.1:5262');
  const [conn, setconn] = useState(false)
  const {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
  } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastJsonMessage !== null) {
      switch (lastJsonMessage.cmd) {
        case 'reply_persons':
          const updatePersons = lastJsonMessage.data.map((elm, idx) => { return { ...elm, id: idx } })
          setpersons(updatePersons)
          const remainPersons = updatePersons.filter(elm => elm.winned !== '');
          setwinners(remainPersons)
          break;

        default:
          break;
      }
    }
  }, [lastJsonMessage]);

  const handleClickSendMessage = useCallback((cmd = '', data = null) => sendJsonMessage({ cmd: cmd, data: data }), []);

  useEffect(() => {
    const connectionStatus = {
      [ReadyState.CONNECTING]: 'Connecting',
      [ReadyState.OPEN]: 'Open',
      [ReadyState.CLOSING]: 'Closing',
      [ReadyState.CLOSED]: 'Closed',
      [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];
    if (connectionStatus === 'Open') {
      handleClickSendMessage('init_persons', 'Hi')
    }
  }, [conn, handleClickSendMessage, readyState])

  const spin = useCallback(() => {
    const remainPersons = persons.filter(elm => elm.winned === '');
    const max = remainPersons.length;
    if (max === 0) return
    const rand = Math.floor(Math.random() * max)
    settargetWinner(remainPersons[rand])
    setspinning(true)
    setcounters({ wheel1: 50, wheel2: 70, wheel3: 100 })
    settargetDepart('')
  }, [persons])

  useEffect(() => {
    if (spinning) {
      const remainPersons = persons.filter(elm => elm.winned === '');
      const max = remainPersons.length;
      const rand1 = Math.floor(Math.random() * max)
      const rand2 = Math.floor(Math.random() * max)
      const rand3 = Math.floor(Math.random() * max)
      const curCounter = { ...counters };
      const timeoutMS = max <= 1 ? 1 : 50;
      if (max === 0) return
      setTimeout(() => {
        if (curCounter.wheel1 >= 0) {
          setwinner(prev => {
            return {
              ...prev,
              wheel1: curCounter.wheel1 === 0 ? targetWinner.name[0] : remainPersons[rand1].name[0],
              wheel2: remainPersons[rand2].name[1],
              wheel3: remainPersons[rand3].name[2]
            }
          })
          setcounters(prev => {
            return {
              ...prev,
              wheel1: prev.wheel1 - 1,
              wheel2: prev.wheel2 - 1,
              wheel3: prev.wheel3 - 1
            }
          })
        } else if (curCounter.wheel2 >= 0) {
          setwinner(prev => {
            return {
              ...prev,
              wheel2: curCounter.wheel2 === 0 ? targetWinner.name[1] : remainPersons[rand2].name[1],
              wheel3: remainPersons[rand2].name[2]
            }
          })
          setcounters(prev => {
            return {
              ...prev,
              wheel2: prev.wheel2 - 1,
              wheel3: prev.wheel3 - 1
            }
          })

        } else if (curCounter.wheel3 >= 0) {
          setwinner(prev => {
            return {
              ...prev,
              wheel3: curCounter.wheel3 === 0 ? targetWinner.name[2] : remainPersons[rand3].name[2]
            }
          })
          setcounters(prev => {
            return {
              ...prev,
              wheel3: prev.wheel3 - 1
            }
          })
        } else {
          setpersons(prev => {
            const curPerson = prev.find(elm => elm.id === targetWinner.id);
            const allWinnersLen = winners.length+1;
            curPerson.winned = allWinnersLen.toFixed(0);
            prev.splice(targetWinner.id, 1, curPerson)
            settargetDepart(curPerson.depart)
            setwinners([...winners, curPerson])
            setspinning(false)
            handleClickSendMessage('update_persons', prev)
            console.log([...winners, curPerson])
            return prev
          })
        }
      }, timeoutMS)

    }
  }, [persons, spinning, counters, targetWinner, winners, handleClickSendMessage])

  const armSpinningClas = counters.wheel1 > 0 ? 'arm armSpinning' : 'arm';
  const wheel1SpinningClas = counters.wheel1 > 0 ? 'wheel wheel-active' : 'wheel';
  const wheel2SpinningClas = counters.wheel2 > 0 ? 'wheel wheel-active' : 'wheel';
  const wheel3SpinningClas = counters.wheel3 > 0 ? 'wheel wheel-active' : 'wheel';

  return (
    <div className="App-wrap">
      <div className="App">
        <div className="slot-machine">
          <div className="slot-body">

            <div className="slot-display slot-wheels-display">
              <div className={wheel1SpinningClas}>
                {winner.wheel1}
              </div>
              <div className={wheel2SpinningClas}>
                {winner.wheel2}
              </div>
              <div className={wheel3SpinningClas}>
                {winner.wheel3}
              </div>
            </div>
            <div className="slot-display slot-department-display">
              {targetDepart}
            </div>
          </div>

          <div className="slot-trigger">
            <div className="ring1">
            </div>
            <div className="ring2">
              <div className={armSpinningClas} onClick={spin}>
                <div className="knob"></div>
              </div>
            </div>
          </div>

        </div>
        <div className="winners">
          {winners.map(elm => {
            return <div key={elm.id}>
              <div>{elm.name[0] + elm.name[1] + elm.name[2]}</div>
              <div>{elm.depart}</div></div>
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
