import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { generate } from "../utils/roomNoGenerator.js";
import { useSocket } from "../context/SocketProvider";

function Login() {
  const [roomNumber, setRoomNumber] = useState(null);
  const [name, setName] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const socket = useSocket();

  const navigate = useNavigate();

  useEffect(() => {
    setCopySuccess(false);
  },[roomNumber]);

  const generateNo = () => {
    setRoomNumber(generate());
  };

  const handelCopy = () => {
    navigator.clipboard.writeText(roomNumber);
    setCopySuccess(true);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("client-connect", { name, roomNumber });
  };

  const handleJoinRoom = useCallback(
    (data) => {
      const { name, roomNumber } = data;
      navigate(`/${roomNumber}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("client-connect", handleJoinRoom);
    return () => {
      socket.off("client-connect", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="h-screen flex min-h-full flex-col bg-slate-100 justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Join Room
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          action="#"
          method="POST"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Name
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="roomNumber"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Room No
              </label>
            </div>
            <div className="mt-2">
              <input
                id="roomNumber"
                name="roomNumber"
                type="text"
                autoComplete="current-roomNo"
                value={roomNumber}
                placeholder="Enter room id or generate one"
                onChange={(e) => setRoomNumber(e.target.value)}
                className="p-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                required
              />
              <div className="flex justify-around">
                <button
                  onClick={handelCopy}
                  type="button"
                  class="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                >
                  {copySuccess ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={generateNo}
                  type="button"
                  class="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
