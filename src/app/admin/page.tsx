"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getToken } from "@/lib/token";

const DESIGN_WIDTH = 1165;
const DESIGN_HEIGHT = 920;

const mono = {
  fontFamily: "var(--font-azeret-mono), 'Azeret Mono', monospace",
  fontWeight: 800,
  fontStyle: "italic" as const,
};

interface Product {
  id: number;
  name: string;
  price: number;
}

interface ProductInRequest {
  id: number;
  requestId: number;
  productId: number;
  time: string;
  product: Product;
}

interface Request {
  id: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  location: string;
  status: number;
  type: number;
  [key: string]: unknown;
}

function statusLabel(status: number): string {
  switch (status) {
    case 1: return "PENDING";
    case 2: return "APPROVED";
    default: return "UNKNOWN";
  }
}

function statusColor(status: number): string {
  switch (status) {
    case 1: return "#5D9EFA";
    case 2: return "#A8F2A2";
    default: return "#999";
  }
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductInRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const update = () => setScale(window.innerWidth / DESIGN_WIDTH);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    async function loadRequests() {
      const token = getToken();
      if (!token) return;
      const res = await fetch("/api/request", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Request[] = await res.json();
        setRequests(data);
        if (data.length > 0) selectRequest(data[0]);
      }
    }
    loadRequests();
  }, []);

  async function selectRequest(req: Request) {
    setSelectedRequest(req);
    setSelectedProducts([]);
    const token = getToken();
    if (!token) return;
    try {
      const reqRes = await fetch(`/api/request/${req.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!reqRes.ok) return;
      const reqData = await reqRes.json();
      const pirIds: number[] = reqData.productInRequestIds ?? [];
      const products = await Promise.all(pirIds.map(async (pirId) => {
        const pirRes = await fetch(`/api/product-in-requests/${pirId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!pirRes.ok) return null;
        const pir = await pirRes.json();
        const pRes = await fetch(`/api/product/${pir.productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!pRes.ok) return null;
        const p = await pRes.json();
        return { ...pir, product: p } as ProductInRequest;
      }));
      setSelectedProducts(products.filter((p): p is ProductInRequest => p !== null));
    } catch (e) {
      console.error("Failed to load products for request", e);
    }
  }

  async function updateRequestStatus(newStatus: number) {
    if (!selectedRequest) return;
    const token = getToken();
    if (!token) return;
    const updated = { ...selectedRequest, status: newStatus };
    try {
      const res = await fetch(`/api/request/${selectedRequest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to update request status", e);
    }
  }

  const filtered = requests.filter((r) => {
    if (filterStatus !== null && r.status !== filterStatus) return false;
    if (
      searchText &&
      !r.location.toLowerCase().includes(searchText.toLowerCase()) &&
      !String(r.id).includes(searchText)
    )
      return false;
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 1).length;
  const approvedCount = requests.filter((r) => r.status === 2).length;

  if (!mounted) return null;

  return (
    <div style={{ width: "100vw", height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
      <div
        style={{
          position: "relative",
          width: `${DESIGN_WIDTH}px`,
          minHeight: `${DESIGN_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: "#1C1A1C",
          overflow: "visible",
        }}
      >
        <Navbar activePage={"admin"}/>

        {/* Red stat card — Pending */}
        <div
          style={{
            position: "absolute",
            left: "10px",
            top: "75px",
            width: "601px",
            height: "175px",
            borderRadius: "20px",
            background: "#FA5D5D",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "30px",
              top: "28px",
              fontSize: "18px",
              color: "#1C1A1C",
              ...mono,
            }}
          >
            PENDING REQUESTS
          </div>
          <div
            style={{
              position: "absolute",
              left: "30px",
              top: "68px",
              fontSize: "80px",
              color: "#1C1A1C",
              lineHeight: 1,
              ...mono,
            }}
          >
            {pendingCount}
          </div>
        </div>

        {/* Green stat card — Approved */}
        <div
          style={{
            position: "absolute",
            left: "640px",
            top: "75px",
            width: "515px",
            height: "175px",
            borderRadius: "20px",
            background: "#A8F2A2",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "30px",
              top: "28px",
              fontSize: "18px",
              color: "#1C1A1C",
              ...mono,
            }}
          >
            APPROVED REQUESTS
          </div>
          <div
            style={{
              position: "absolute",
              left: "30px",
              top: "68px",
              fontSize: "80px",
              color: "#1C1A1C",
              lineHeight: 1,
              ...mono,
            }}
          >
            {approvedCount}
          </div>
        </div>

        {/* Search input */}
        <div
          style={{
            position: "absolute",
            left: "14px",
            top: "255px",
            width: "380px",
            height: "60px",
            borderRadius: "12px",
            background: "#EFEFEF",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
          }}
        >
          <input
            type="text"
            placeholder="SEARCH..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              width: "100%",
              fontSize: "16px",
              outline: "none",
              color: "#1C1A1C",
              ...mono,
            }}
          />
        </div>

        {/* Filter buttons */}
        <div
          style={{
            position: "absolute",
            left: "410px",
            top: "255px",
            display: "flex",
            gap: "12px",
          }}
        >
          {[
            { label: "ALL", value: null, active: "#5D9EFA" },
            { label: "PENDING", value: 1, active: "#5D9EFA" },
            { label: "APPROVED", value: 2, active: "#A8F2A2" },
          ].map(({ label, value, active }) => {
            const isActive = filterStatus === value;
            return (
              <button
                key={label}
                onClick={() => setFilterStatus(value)}
                style={{
                  height: "60px",
                  padding: "0 28px",
                  borderRadius: "12px",
                  background: isActive ? active : "#2A2A2A",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: isActive ? "#1C1A1C" : "#EFEFEF",
                  ...mono,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Selected request info overlay on the black SVG rectangle */}
        <div
          style={{
            position: "absolute",
            left: "25px",
            top: "1014px",
            width: "653px",
            height: "507px",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          {selectedRequest ? (
            <>
              <div style={{ ...mono, fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                LOCATION
              </div>
              <div style={{ ...mono, fontSize: "28px", color: "#EFEFEF", marginBottom: "32px" }}>
                {selectedRequest.location}
              </div>
              <div style={{ display: "flex", gap: "48px" }}>
                <div>
                  <div style={{ ...mono, fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                    START DATE
                  </div>
                  <div style={{ ...mono, fontSize: "20px", color: "#EFEFEF" }}>
                    {new Date(selectedRequest.startDate).toLocaleDateString("en-GB")}
                  </div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                    END DATE
                  </div>
                  <div style={{ ...mono, fontSize: "20px", color: "#EFEFEF" }}>
                    {new Date(selectedRequest.endDate).toLocaleDateString("en-GB")}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ ...mono, fontSize: "16px", color: "#444" }}>
              SELECT A REQUEST
            </div>
          )}
        </div>

        {/* SVG background — underneath Rectangle 3 */}
        <div
          style={{
            position: "absolute",
            left: "-3px",
            top: "1000px",
            width: "1137px",
            height: "547px",
            zIndex: 2,
          }}
        >
            <svg width="1137" height="547" viewBox="0 0 1137 547" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_370_264)">
                    <path d="M1121.17 0H15.8335C7.08889 0 0 6.37037 0 14.2286V532.771C0 540.63 7.08889 547 15.8335 547H1121.17C1129.91 547 1137 540.63 1137 532.771V14.2286C1137 6.37037 1129.91 0 1121.17 0Z" fill="#EFEFEF"/>
                    <mask id="mask0_370_264" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="776" y="46" width="253" height="169">
                        <path d="M1028.15 46.8258H776.151V214.349H1028.15V46.8258Z" fill="white"/>
                    </mask>
                    <g mask="url(#mask0_370_264)">
                        <path onClick={() => updateRequestStatus(2)} style={{ cursor: selectedRequest ? "pointer" : "default" }} d="M900.24 214.349L859.524 213.136L831.608 193.788L799.034 179.312L787.32 155.104L776.151 130.697L787.616 106.344L795.668 80.6674L822.478 60.3696L858.829 47.0266L900.24 47.4155L941.761 46.8258L973.903 63.6172L1000.09 82.6525L1020.41 104.929L1028.15 130.697L1012.99 155.073L996.19 177.105L974.098 197.931L941.349 213.835L900.24 214.349Z" fill="#FF1DFF"/>
                        <text x="900" y="138" textAnchor="middle" dominantBaseline="middle" fill="#1C1A1C" fontSize="18" fontFamily="'Azeret Mono', monospace" fontWeight="800" fontStyle="italic" style={{ pointerEvents: "none" }}>APPROVE</text>
                    </g>
                    <mask id="mask1_370_264" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="780" y="288" width="253" height="169">
                        <path d="M1032.15 288.643H780.15V456.165H1032.15V288.643Z" fill="white"/>
                    </mask>
                    <g mask="url(#mask1_370_264)">
                        <path onClick={() => updateRequestStatus(99)} style={{ cursor: selectedRequest ? "pointer" : "default" }} d="M904.24 456.165L863.523 454.952L835.607 435.604L803.034 421.127L791.321 396.92L780.15 372.512L791.617 348.16L799.668 322.484L826.478 302.186L862.83 288.843L904.24 289.232L945.762 288.643L977.903 305.433L1004.09 324.469L1024.41 346.745L1032.15 372.512L1016.99 396.889L1000.19 418.922L978.099 439.747L945.349 455.651L904.24 456.165Z" fill="#0496FF"/>
                        <text x="906" y="372" textAnchor="middle" dominantBaseline="middle" fill="#1C1A1C" fontSize="18" fontFamily="'Azeret Mono', monospace" fontWeight="800" fontStyle="italic" style={{ pointerEvents: "none" }}>REJECTED</text>
                    </g>
                    <path d="M679.327 14.3566H29.6725C28.7488 14.3566 28 15.0295 28 15.8596V519.794C28 520.624 28.7488 521.297 29.6725 521.297H679.327C680.251 521.297 681 520.624 681 519.794V15.8596C681 15.0295 680.251 14.3566 679.327 14.3566Z" fill="#1C1A1C"/>
                    <path d="M498.062 108.713L520.79 17.4801L552.794 17.4922C461.283 236.435 391.851 534.583 456.852 524.024C440.846 518.908 467.318 273.596 432.63 282.706C439.201 313.799 507.982 114.123 525.525 51.4233L498.062 108.713Z" fill="#FF1DFF"/>
                    <path d="M121.735 69.8364C127.667 75.1447 132.945 79.8338 137.641 84.0472C142.462 88.105 146.665 91.6756 150.389 94.8053C157.767 101.16 162.977 105.945 166.763 109.731C174.279 117.244 175.974 120.557 177.365 123.609C178.756 126.661 179.925 129.438 186.399 135.844C189.636 139.047 194.202 143.176 200.799 148.71C207.451 154.183 215.823 161.432 227.751 169.529C232.966 175.03 230.78 174.368 224.882 170.658C221.968 168.756 218.005 166.259 213.793 163.083C209.639 159.848 204.983 156.242 200.363 152.65C181.913 138.171 163.511 123.668 173.956 135.23C160.063 121.743 147.634 110.1 137.353 100.459C134.794 98.0425 132.353 95.7451 130.063 93.5786C127.889 91.2925 125.819 89.1613 123.901 87.161C120.079 83.1245 116.851 79.6473 114.324 76.7653C104.145 65.0943 104.869 62.4428 121.758 69.884L121.735 69.8364Z" fill="#0496FF"/>
                    <path d="M360.106 69.8364C354.173 75.1447 348.894 79.8338 344.2 84.0472C339.378 88.105 335.176 91.6756 331.452 94.8053C324.072 101.16 318.863 105.945 315.076 109.731C307.561 117.244 305.866 120.557 304.476 123.609C303.084 126.661 301.915 129.438 295.442 135.844C292.204 139.047 287.637 143.176 281.042 148.71C274.389 154.183 266.017 161.432 254.088 169.529C248.874 175.03 251.06 174.368 256.958 170.658C259.872 168.756 263.836 166.259 268.047 163.083C272.201 159.848 276.856 156.242 281.477 152.65C299.926 138.171 318.329 123.668 307.884 135.23C321.778 121.743 334.207 110.1 344.486 100.459C347.045 98.0425 349.487 95.7451 351.776 93.5786C353.952 91.2925 356.02 89.1613 357.938 87.161C361.762 83.1245 364.988 79.6473 367.516 76.7653C377.694 65.0943 376.972 62.4428 360.082 69.884L360.106 69.8364Z" fill="#0496FF"/>
                    <path d="M383.121 247.225C376.082 243.71 369.85 240.569 364.269 237.792C358.777 234.834 353.96 232.269 349.721 229.982C341.188 225.513 334.897 222.474 330.05 220.387C320.432 216.244 316.819 215.947 313.558 215.834C310.297 215.721 307.367 215.71 299.14 212.115C295.027 210.316 289.57 207.628 282.072 203.574C274.606 199.443 264.89 194.387 253.032 186.306C246.101 183.544 247.543 185.349 253.143 189.46C255.972 191.465 259.738 194.227 264.207 196.955C268.708 199.605 273.731 202.585 278.731 205.536C298.811 217.267 318.895 228.944 304.528 223.628C321.953 231.444 337.163 238.605 349.755 244.523C352.904 245.989 355.901 247.391 358.723 248.701C361.605 249.856 364.311 250.972 366.838 251.996C371.923 254.02 376.278 255.7 379.83 256.953C394.19 261.976 396.272 260.249 383.07 247.222L383.121 247.225Z" fill="#FF1DFF"/>
                    <path d="M98.719 247.225C105.758 243.71 111.99 240.569 117.571 237.792C123.063 234.834 127.88 232.269 132.118 229.982C140.653 225.513 146.944 222.474 151.791 220.387C161.409 216.244 165.021 215.947 168.282 215.834C171.543 215.721 174.474 215.71 182.701 212.115C186.814 210.316 192.271 207.628 199.768 203.574C207.235 199.443 216.95 194.387 228.807 186.306C235.738 183.544 234.298 185.349 228.698 189.46C225.868 191.465 222.101 194.227 217.632 196.955C213.132 199.605 208.109 202.585 203.109 205.536C183.028 217.267 162.944 228.944 177.313 223.628C159.887 231.444 144.677 238.605 132.085 244.523C128.936 245.989 125.939 247.391 123.118 248.701C120.234 249.856 117.53 250.972 115.001 251.996C109.917 254.02 105.562 255.7 102.011 256.953C87.6498 261.976 85.5684 260.249 98.7706 247.222L98.719 247.225Z" fill="#FF1DFF"/>
                    <path d="M272.281 271.1C270.71 267.303 269.306 263.954 268.066 260.938C266.738 258.078 265.587 255.556 264.56 253.352C262.556 248.847 261.202 245.404 260.282 242.628C258.455 237.121 258.375 234.447 258.378 231.957C258.38 229.468 258.426 227.189 256.838 222.504C256.044 220.161 254.844 217.199 253.023 213.303C251.164 209.468 248.898 204.325 245.213 198.967C244.004 194.89 244.848 195.145 246.731 197.534C247.647 198.776 248.911 200.384 250.147 202.556C251.345 204.79 252.692 207.274 254.027 209.753C259.326 219.767 264.599 229.81 262.289 221.164C265.749 230.992 268.933 239.407 271.562 246.38C272.213 248.13 272.837 249.792 273.419 251.362C273.925 253.055 274.414 254.626 274.864 256.106C275.749 259.097 276.483 261.684 277.025 263.851C279.192 272.633 278.324 275.087 272.28 271.061L272.281 271.1Z" fill="#0496FF"/>
                    <path d="M209.559 271.1C211.129 267.303 212.533 263.954 213.773 260.938C215.102 258.078 216.253 255.556 217.28 253.352C219.284 248.847 220.637 245.404 221.558 242.628C223.385 237.121 223.465 234.447 223.463 231.957C223.461 229.468 223.414 227.189 225.003 222.504C225.797 220.161 226.995 217.199 228.817 213.303C230.676 209.468 232.942 204.325 236.627 198.967C237.836 194.89 236.992 195.145 235.109 197.534C234.193 198.776 232.929 200.384 231.693 202.556C230.494 204.79 229.147 207.274 227.814 209.753C222.514 219.767 217.241 229.81 219.55 221.164C216.09 230.992 212.907 239.407 210.278 246.38C209.626 248.13 209.003 249.792 208.421 251.362C207.916 253.055 207.425 254.626 206.976 256.106C206.091 259.097 205.357 261.684 204.816 263.851C202.647 272.633 203.516 275.087 209.559 271.061V271.1Z" fill="#0496FF"/>
                    <path d="M131.983 176.497C135.985 176.805 139.52 177.095 142.695 177.332C145.756 177.706 148.448 178.016 150.808 178.307C155.6 178.809 159.207 179.019 162.058 179.023C167.717 179.031 170.204 178.248 172.495 177.445C174.785 176.642 176.87 175.865 181.695 175.904C184.107 175.923 187.22 176.138 191.393 176.658C195.521 177.235 200.986 177.786 207.104 179.652C211.246 179.518 210.74 178.778 207.936 177.713C206.498 177.22 204.61 176.507 202.212 176.002C199.771 175.554 197.05 175.041 194.339 174.539C183.413 172.601 172.47 170.696 181.174 170.164C171.013 169.956 162.241 169.564 154.975 169.245C153.154 169.174 151.423 169.102 149.79 169.041C148.069 169.093 146.464 169.121 144.958 169.159C141.919 169.259 139.301 169.378 137.131 169.547C128.348 170.261 126.368 171.896 132.019 176.486L131.983 176.497Z" fill="#FF1DFF"/>
                    <path d="M349.856 176.497C345.856 176.805 342.321 177.095 339.144 177.332C336.085 177.706 333.392 178.016 331.031 178.307C326.24 178.809 322.634 179.019 319.782 179.023C314.124 179.031 311.635 178.248 309.345 177.445C307.055 176.642 304.971 175.865 300.146 175.904C297.733 175.923 294.62 176.138 290.447 176.658C286.318 177.235 280.854 177.786 274.735 179.652C270.593 179.518 271.1 178.778 273.905 177.713C275.342 177.22 277.23 176.507 279.627 176.002C282.069 175.554 284.79 175.041 287.501 174.539C298.427 172.601 309.369 170.696 300.666 170.164C310.827 169.956 319.6 169.564 326.865 169.245C328.686 169.174 330.417 169.102 332.049 169.041C333.771 169.093 335.375 169.121 336.882 169.159C339.921 169.259 342.54 169.378 344.708 169.547C353.491 170.261 355.472 171.896 349.821 176.486L349.856 176.497Z" fill="#FF1DFF"/>
                    <path d="M198.469 99.4489C200.231 103.177 201.803 106.464 203.196 109.426C204.669 112.227 205.947 114.698 207.085 116.857C209.316 121.272 210.843 124.657 211.903 127.393C214.008 132.821 214.221 135.496 214.344 137.988C214.466 140.481 214.534 142.767 216.357 147.384C217.269 149.692 218.618 152.602 220.636 156.418C222.689 160.169 225.213 165.212 229.171 170.403C230.585 174.428 229.727 174.212 227.723 171.911C226.744 170.71 225.399 169.159 224.052 167.043C222.741 164.864 221.268 162.44 219.809 160.021C214.004 150.243 208.223 140.436 210.967 148.986C207.012 139.308 203.404 131.031 200.424 124.174C199.685 122.451 198.978 120.816 198.317 119.272C197.726 117.6 197.156 116.049 196.633 114.589C195.597 111.635 194.733 109.079 194.083 106.935C191.474 98.2426 192.22 95.7431 198.472 99.4874L198.469 99.4489Z" fill="#0496FF"/>
                    <path d="M283.371 99.4489C281.61 103.177 280.036 106.464 278.645 109.426C277.172 112.227 275.893 114.698 274.754 116.857C272.523 121.272 270.997 124.657 269.936 127.393C267.832 132.821 267.618 135.496 267.497 137.988C267.375 140.481 267.307 142.767 265.483 147.384C264.571 149.692 263.222 152.602 261.205 156.418C259.152 160.169 256.626 165.212 252.669 170.403C251.255 174.428 252.113 174.212 254.117 171.911C255.096 170.71 256.442 169.159 257.788 167.043C259.099 164.864 260.572 162.44 262.032 160.021C267.837 150.243 273.617 140.436 270.873 148.986C274.828 139.308 278.435 131.031 281.417 124.174C282.156 122.451 282.863 120.816 283.524 119.272C284.115 117.6 284.684 116.049 285.208 114.589C286.244 111.635 287.107 109.079 287.757 106.935C290.367 98.2426 289.62 95.7431 283.368 99.4874L283.371 99.4489Z" fill="#0496FF"/>
                    <path d="M245.795 275.25C245.607 271.127 245.423 267.486 245.282 264.214C245.003 261.058 244.777 258.281 244.56 255.847C244.206 250.907 244.101 247.194 244.178 244.263C244.328 238.445 245.157 235.91 246.002 233.578C246.846 231.245 247.66 229.125 247.757 224.164C247.805 221.683 247.682 218.477 247.293 214.173C246.847 209.912 246.464 204.28 244.821 197.938C245.068 193.683 243.347 193.76 244.304 196.672C244.742 198.164 245.629 200.738 246.052 203.216C246.419 205.739 249.023 208.402 249.435 211.204C251.014 222.489 252.56 233.792 253.321 224.858C253.148 212.039 259.927 260.449 251.756 251.024C251.774 252.899 253.524 255.472 253.539 257.151C253.439 258.92 253.368 260.568 253.289 262.116C253.106 265.237 257.262 268.389 257.035 270.614C244.327 241.345 250.111 281.15 245.807 275.212L245.795 275.25Z" fill="#0496FF"/>
                    <path d="M236.046 275.25C236.233 271.127 236.417 267.486 236.559 264.214C236.837 261.058 237.063 258.281 237.28 255.847C237.635 250.907 237.739 247.194 237.663 244.263C237.512 238.445 236.683 235.91 235.839 233.578C234.993 231.245 234.181 229.125 234.084 224.164C234.034 221.683 234.158 218.477 234.547 214.173C234.992 209.912 235.377 204.28 237.019 197.938C236.773 193.683 238.493 193.76 237.536 196.672C237.097 198.164 236.212 200.738 235.788 203.216C235.42 205.739 232.817 208.402 232.405 211.204C230.826 222.489 229.28 233.792 228.519 224.858C228.692 212.039 221.914 260.449 230.085 251.024C230.066 252.899 228.315 255.472 228.302 257.151C228.4 258.92 228.473 260.568 228.552 262.116C228.734 265.237 224.579 268.389 224.804 270.614C237.513 241.345 231.73 281.15 236.034 275.212L236.046 275.25Z" fill="#0496FF"/>
                    <path d="M134.935 232.091C138.79 230.947 142.201 229.955 145.26 229.041C148.255 228.296 150.884 227.624 153.196 227.052C157.858 225.808 161.31 224.716 163.985 223.699C169.292 221.681 171.36 220.057 173.236 218.485C175.112 216.912 176.802 215.438 181.339 213.748C183.607 212.903 186.599 211.992 190.686 210.986C194.753 210.049 200.063 208.612 206.43 208.171C210.268 206.562 210.751 208.263 207.761 208.268C206.247 208.32 203.593 208.286 201.174 208.67C198.732 209.124 195.443 207.445 192.731 207.945C181.833 210.038 170.929 212.168 178.909 208.553C190.768 204.598 144.016 213.569 155.321 218.494C153.59 219.08 150.658 218.203 149.107 218.729C147.51 219.394 146.015 219.994 144.617 220.57C141.8 221.751 137.562 218.719 135.586 219.654C166.622 222.615 128.113 229.786 134.964 232.068L134.935 232.091Z" fill="#FF1DFF"/>
                    <path d="M346.906 232.091C343.05 230.947 339.638 229.955 336.581 229.041C333.585 228.296 330.957 227.624 328.645 227.052C323.982 225.808 320.531 224.716 317.856 223.699C312.547 221.681 310.48 220.057 308.605 218.485C306.728 216.912 305.038 215.438 300.502 213.748C298.233 212.903 295.242 211.992 291.153 210.986C287.087 210.049 281.778 208.612 275.41 208.171C271.572 206.562 271.089 208.263 274.079 208.268C275.594 208.32 278.248 208.286 280.666 208.67C283.107 209.124 286.396 207.445 289.108 207.945C300.008 210.038 310.912 212.168 302.93 208.553C291.072 204.598 337.824 213.569 326.519 218.494C328.25 219.08 331.182 218.203 332.734 218.729C334.33 219.394 335.825 219.994 337.224 220.57C340.04 221.751 344.278 218.719 346.254 219.654C315.218 222.615 353.728 229.786 346.876 232.068L346.906 232.091Z" fill="#FF1DFF"/>
                </g>
                <defs>
                    <clipPath id="clip0_370_264">
                        <rect width="1137" height="547" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        </div>

        {/* Rectangle 3 — main requests area */}
        <div
          style={{
            position: "absolute",
            left: "-3px",
            top: "320px",
            width: "1137px",
            height: "673px",
            borderRadius: "20px",
            background: "#EFEFEF",
            zIndex: 1,
          }}
        >
          {/* Dark left panel — request list */}
          <div
            style={{
              position: "absolute",
              left: "28px",
              top: "20px",
              width: "653px",
              height: "633px",
              borderRadius: "15px",
              background: "#1C1A1C",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                overflowY: "auto",
                height: "100%",
                padding: "14px",
                scrollbarWidth: "none",
              }}
            >
              {filtered.map((req) => (
                <div
                  key={req.id}
                  onClick={() => selectRequest(req)}
                  style={{
                    width: "100%",
                    height: "58px",
                    borderRadius: "10px",
                    background: selectedRequest?.id === req.id ? "#333" : "#252525",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    cursor: "pointer",
                    gap: "16px",
                    ...mono,
                    fontSize: "14px",
                    color: "#EFEFEF",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ color: "#666", minWidth: "44px" }}>#{req.id}</span>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {req.location}
                  </span>
                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: "20px",
                      background: statusColor(req.status),
                      color: "#1C1A1C",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel(req.status)}
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div
                  style={{
                    color: "#444",
                    padding: "40px 20px",
                    textAlign: "center",
                    ...mono,
                    fontSize: "16px",
                  }}
                >
                  NO REQUESTS FOUND
                </div>
              )}
            </div>
          </div>

          {/* Right panel — selected request detail */}
          <div
            style={{
              position: "absolute",
              left: "700px",
              top: "20px",
              width: "412px",
              height: "233px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              padding: "10px",
              boxSizing: "border-box",
            }}
          >
            {selectedRequest ? (
              <div style={{ width: "100%", height: "100%", overflowY: "auto", scrollbarWidth: "none" }}>
                {/* Header row */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 8px 8px",
                  ...mono,
                  fontSize: "11px",
                  color: "#888",
                  borderBottom: "1px solid #ddd",
                  marginBottom: "6px",
                }}>
                  <span>PRODUCT</span>
                  <span>TIME</span>
                  <span>PRICE</span>
                </div>
                {selectedProducts.length === 0 && (
                  <div style={{ color: "#999", ...mono, fontSize: "12px", padding: "8px" }}>
                    NO PRODUCTS
                  </div>
                )}
                {selectedProducts.map((pir) => (
                  <div
                    key={pir.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      borderRadius: "8px",
                      background: "#f5f5f5",
                      marginBottom: "4px",
                      ...mono,
                      fontSize: "12px",
                      color: "#1C1A1C",
                      gap: "8px",
                    }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pir.product?.name ?? `#${pir.productId}`}
                    </span>
                    <span style={{ color: "#555", whiteSpace: "nowrap", flexShrink: 0, marginRight: "120px" }}>
                      {pir.time ? (() => { const d = new Date(pir.time); return isNaN(d.getTime()) ? pir.time.slice(0, 5) : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); })() : "—"}
                    </span>
                    <span style={{ color: "#1C1A1C", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {pir.product?.price != null ? `${pir.product.price} kr` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#888", ...mono, fontSize: "14px", marginTop: "40px" }}>
                SELECT A REQUEST
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
