import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/redux/authSlice";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [input, setInput] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const loginHandler = async (e) => {
    e.preventDefault();
    console.log(input);
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/user/login", input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        navigate("/");
        toast.success(res.data.message);
        setInput({
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, []);
  return (
    <div className="flex items-center w-screen h-screen justify-center">
      <form
        onSubmit={loginHandler}
        className="shadow-lg flex flex-col gap-5 p-8"
      >
        <div>
          <h1 className="text-center font-bold text-xl underline text-blue-700">
            Login
          </h1>
          <br />
          <p className="text-sm text-center">
            {" "}
            Sign up today to unlock a window into the moments shared by your
            <br />
            friends—captured in vibrant photos and videos.
          </p>
        </div>
        <div>
          <span className="font-medium">Email</span>
          <Input
            type="email"
            placeholder="Enter your email"
            name="email"
            value={input.email}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
          />
        </div>
        <div>
          <span className="font-medium">Password</span>
          <Input
            type="password"
            placeholder="Enter your password"
            name="password"
            value={input.password}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
          />
        </div>
        {loading ? (
          <Button>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="bg-blue-500  hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring focus:ring-sky-300"
          >
            Login
          </Button>
        )}
        <span className="text-center">
          Doesn’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 underline">
            Signup
          </Link>
        </span>
      </form>
    </div>
  );
};

export default Login;
