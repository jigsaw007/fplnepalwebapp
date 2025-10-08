// src/pages/MySquads.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function MySquads() {
  const [squads, setSquads] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  useEffect(() => {
    const fetchSquads = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("squads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setSquads(data);
    };
    fetchSquads();
  }, [user]);

  if (!user) return <p className="p-4">Please log in to view your squads.</p>;
  if (squads.length === 0)
    return <p className="p-4">No saved squads yet. <Link to="/create-squad" className="text-indigo-600">Create one!</Link></p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">My Saved Squads</h1>
      <div className="grid md:grid-cols-2 gap-3">
        {squads.map((squad) => (
          <div
            key={squad.id}
            className="border rounded p-3 shadow hover:shadow-md bg-white"
          >
            <h2 className="font-semibold text-gray-800">{squad.squad_name}</h2>
            <p className="text-sm text-gray-500 mb-2">
              Budget left: £{(squad.budget || 0).toFixed(1)}m
            </p>
            <Link
              to={`/tinker-squad/${squad.id}`}
              className="text-indigo-600 hover:underline text-sm"
            >
              ✏️ Open to Tinker
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
