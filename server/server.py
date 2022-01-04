#!/usr/bin/python
# -*- coding: UTF-8 -*-

from __future__ import print_function
import os, traceback
import asyncio
import websockets
import websockets.legacy.server
import json, sys
import csv, pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
os.chdir(SCRIPT_DIR)

def get_file_in_cwd(filename):
    # determine if application is a script file or frozen exe
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(sys.executable)
    elif __file__:
        application_path = os.path.dirname(__file__)

    return os.path.join(application_path, filename)

personsCSVPath= get_file_in_cwd('persons.csv')

class PyServerAPI(object):
    def __init__(self, persons=[]):
        self.users = set()
        self.persons = self.read_persons()

    async def register(self,websocket):
        self.users.add(websocket)
        print('new user connected: {}'.format(websocket))

    async def unregister(self,websocket):
        self.users.remove(websocket)
        print('user disconnected: {}'.format(websocket))
    
    def read_persons(self):
        global personsCSVPath
        personsCSVPath= get_file_in_cwd('persons.csv')
        dfPersons = pd.read_csv(personsCSVPath)
        dfPersons.fillna('', inplace=True)
        self.persons = dfPersons.to_dict('records')
        return self.persons
    
    def update_persons(self, data):
        global personsCSVPath
        personsCSVPath= get_file_in_cwd('persons.csv')
        df = pd.DataFrame(data)
        df = df[["depart", "name", "winned"]]
        df.to_csv(personsCSVPath, sep=',', encoding='utf-8', header=["depart", "name", "winned"], index=False)

    async def handler(self,websocket, path):
        # register(websocket) sends user_event() to websocket
        await self.register(websocket)
        async for message in websocket:
            try:
                # print(message)
                # print(message)
                msg = json.loads(message)
                cmd = msg["cmd"]
                data = msg["data"]
                if cmd == 'getMessage':
                    print(self.persons)
                    await self.sendMsg(websocket, 'reply_persons', self.persons)
                elif cmd == 'update_persons':
                    self.update_persons(data)
                    await self.sendMsg(websocket, 'reply_persons', self.persons)
                
            except websockets.ConnectionClosedError as e:
                self.unregister(websocket)
            except Exception as e:
                try:
                    err_msg = traceback.format_exc()
                    await self.sendMsg(websocket,'reply_server_error',{'error':err_msg})
                except:
                    print('error during excetipn handling')
                    print(e)

    async def sendMsg(self, websocket, cmd, data=None):
        msg = {'cmd': cmd, 'data': data}
        filter_cmd = ['update_cur_status', 'pong', 'ignore']
        if 'ignore' not in filter_cmd:
            if cmd not in filter_cmd:
                print('server sent msg: {}'.format(msg['cmd']))
        jData = json.dumps(msg)
        await websocket.send(jData)  

async def main():
    try:
        sokObj = PyServerAPI()
        port=5262
        addr = 'ws://127.0.0.1:{}'.format(port)
        print('start running on {}'.format(addr))
        # start_server = websockets.serve(sokObj.handler, "127.0.0.1", port, ssl=ssl_context, ping_interval=30, write_limit=2**20, max_size=None)
        async with websockets.serve(sokObj.handler, "127.0.0.1", port, ping_interval=30, write_limit=2**20, max_size=None):
            await asyncio.Future()  # run forever
    except Exception as e:
        err_msg = traceback.format_exc()
        print(f'backend fatal error when initializing: {err_msg}')

if __name__ == '__main__':
    asyncio.run(main())