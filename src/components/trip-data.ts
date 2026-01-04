// Trip itinerary data
export const tripStops = [
  {
    day: "Wednesday, Jan 21",
    stops: [
      { name: "Depart Davenport", time: "8:00 AM CT", lat: 41.5236, lng: -90.5776, label: "Davenport, IA" },
      { name: "Lunch with Kaitlyn and Alex", time: "1:45 PM ET", lat: 40.4864, lng: -86.1336, label: "Kokomo, IN" },
      { name: "Roberts Camera", time: "4:30 PM ET", lat: 39.7684, lng: -86.1581, label: "Indianapolis, IN" },
      { name: "Big Red Liquors", time: "5:15 PM ET", lat: 39.7684, lng: -86.1581, label: "Indianapolis, IN" },
      { name: "Dinner with Charlie and Aly", time: "6:00 PM ET", lat: 39.7684, lng: -86.1581, label: "Indianapolis, IN" },
    ],
  },
  {
    day: "Thursday, Jan 22",
    stops: [
      { name: "Depart Indianapolis", time: "5:30 AM ET", lat: 39.7684, lng: -86.1581, label: "Indianapolis, IN" },
      { name: "Coffee with Kevin", time: "7:00 AM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Lecture at Cunningham Library", time: "9:00 AM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Lunch with Dave Malooley", time: "11:30 AM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Coffee Pick-up for Emilee", time: "1:15 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Spiritual Direction with Fr. Adrian", time: "2:00 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Visit with Emilee", time: "3:00 PM CT", lat: 39.3914, lng: -87.6903, label: "Marshall, IL" },
      { name: "Dinner at Schnitzelbank", time: "8:22 PM ET", lat: 38.3911, lng: -86.9311, label: "Jasper, IN" },
      { name: "St. Benedict's Brew Works", time: "9:40 PM ET", lat: 38.2217, lng: -86.8628, label: "Ferdinand, IN" },
      { name: "Arrive Saint Meinrad", time: "10:00 PM ET", lat: 38.1667, lng: -86.8167, label: "Saint Meinrad, IN" },
    ],
  },
  {
    day: "Friday, Jan 23",
    stops: [
      { name: "Depart Saint Meinrad", time: "10:00 AM CT", lat: 38.1667, lng: -86.8167, label: "Saint Meinrad, IN" },
      { name: "Drop off George in Marshall", time: "12:20 PM CT", lat: 39.3914, lng: -87.6903, label: "Marshall, IL" },
      { name: "Spiritual Direction - Sarak", time: "1:45 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Spiritual Direction - Sara and Whitney", time: "2:30 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Spiritual Direction - Marsha", time: "3:15 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Big Red Liquors", time: "4:00 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Dinner with Ryan and family", time: "5:00 PM ET", lat: 39.4667, lng: -87.4139, label: "Terre Haute, IN" },
      { name: "Arrive home in Davenport", time: "10:30 PM CT", lat: 41.5236, lng: -90.5776, label: "Davenport, IA" },
    ],
  },
];

// Flatten all stops for easy access
export const allStops = tripStops.flatMap(day => day.stops);

// Get center point for initial map view
export const mapCenter = {
  lat: 39.5,
  lng: -87.5,
};
