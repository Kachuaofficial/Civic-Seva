import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedReports = snapshot.docs.map((doc) => {
          const data = doc.data();
          
          // Map category to department
          const departmentMap = {
            Roads: "Public Works",
            Water: "Water Board",
            Electricity: "Electrical",
            Sanitation: "Sanitation",
            "Public Safety": "Police",
            Other: "General",
          };

          // Format dates
          let submittedAt = "Unknown date";
          let reportedAt = new Date().toISOString();
          
          if (data.createdAt) {
            const date = data.createdAt.toDate();
            reportedAt = date.toISOString();
            submittedAt = date.toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          // Generate a fake intensity for the heatmap based on status
          const intensity = data.status === "pending" ? 0.8 : data.status === "fixed" ? 0.2 : 0.5;
          
          // Extract priority based on category
          const priority = ["Roads", "Water", "Electricity"].includes(data.category) ? "High" : "Medium";

          return {
            id: doc.id,
            title: data.title || "No Title",
            description: data.description || "No Description",
            category: data.category || "Other",
            status: data.status || "pending",
            reportedBy: data.userName || "Anonymous",
            location: data.locationName || "Unknown Location",
            area: data.locationName || "Unknown Area", // Fallback for area
            department: departmentMap[data.category] || "General",
            priority: priority,
            submittedAt: submittedAt,
            
            // Map fields for heatmap
            reportedAt: reportedAt,
            coordinates: [data.longitude || 0, data.latitude || 0],
            intensity: intensity,
            city: "Unknown City", // Deriving city from string is complex without a fixed format
            ward: "Unknown Ward",
            zone: "Unknown Zone",
          };
        });

        setReports(fetchedReports);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching reports:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { reports, loading, error };
}
