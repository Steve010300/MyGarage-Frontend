import { Route, Routes } from "react-router";
import Layout from "./layout/Layout";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetail from "./pages/CarDetail";
import EditCar from "./pages/EditCar";
import UploadCar from "./pages/UploadCar";
import Favorites from "./pages/Favorites";
import MyCars from "./pages/MyCars";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/cars/:id/edit" element={<EditCar />} />
        <Route path="/my-cars" element={<MyCars />} />
        <Route path="/upload" element={<UploadCar />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}
