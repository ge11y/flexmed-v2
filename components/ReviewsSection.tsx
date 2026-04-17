import { Check } from "lucide-react";

const GREEN_CIRCLE_STYLE: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: "rgb(159,183,120)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const STAT_CARD_STYLE: React.CSSProperties = {
  border: "1px solid rgb(229,229,229)",
  borderRadius: "20px",
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const NUMBER_STYLE: React.CSSProperties = {
  fontSize: "40px",
  fontWeight: 700,
  color: "rgb(29,29,31)",
  lineHeight: 1,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(29,29,31,0.6)",
};

const REVIEWS = [
  {
    quote:
      "I signed up mainly for the medication, but the Lose It for Life course surprised me. It helped me see why I always gained the weight back before. I'm about 4 months in and down 26 pounds. I feel calmer around food and not constantly thinking about it. That alone has been huge for me.",
    author: "— Laura B., 47, Illinois",
  },
  {
    quote:
      "I've been using Telezen MD's GLP-1 program for a little over 6 months. I ended up choosing the annual plan because the savings were significant and I knew I'd want to stick with it. I'm down 38 pounds so far. Everything has been smooth and the support team is easy to reach, which I really appreciate.",
    author: "— Mark D., 55, North Carolina",
  },
];

export function ReviewsSection() {
  return (
    <section
      style={{
        backgroundColor: "white",
        padding: "80px 40px",
      }}
    >
      {/* Heading */}
      <h2
        style={{
          fontSize: "40px",
          fontWeight: 700,
          textAlign: "center",
          color: "rgb(29,29,31)",
          marginBottom: "48px",
        }}
      >
        Real Customers. Real Reviews. Real Results.
      </h2>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Card 1 */}
        <div style={STAT_CARD_STYLE}>
          <div style={GREEN_CIRCLE_STYLE}>
            <Check size={20} color="white" strokeWidth={2.5} />
          </div>
          <div style={NUMBER_STYLE}>100k+</div>
          <div style={LABEL_STYLE}>Happy Members</div>
        </div>

        {/* Card 2 — Google */}
        <div style={STAT_CARD_STYLE}>
          {/* Google G icon */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="20" fill="#ffffff" />
            <text
              x="20"
              y="27"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill="#4285F4"
              fontFamily="Arial, sans-serif"
            >
              G
            </text>
          </svg>
          <div style={NUMBER_STYLE}>4.9</div>
          <div style={{ color: "rgb(251,188,5)", fontSize: "16px" }}>
            ★★★★★
          </div>
          <div style={LABEL_STYLE}>Google Review</div>
        </div>

        {/* Card 3 */}
        <div style={STAT_CARD_STYLE}>
          <div style={GREEN_CIRCLE_STYLE}>
            <Check size={20} color="white" strokeWidth={2.5} />
          </div>
          <div style={NUMBER_STYLE}>99%</div>
          <div style={LABEL_STYLE}>
            of Telezen MD customers have left 5 star reviews
          </div>
        </div>

        {/* Card 4 */}
        <div style={STAT_CARD_STYLE}>
          <div style={GREEN_CIRCLE_STYLE}>
            <Check size={20} color="white" strokeWidth={2.5} />
          </div>
          <div style={NUMBER_STYLE}>97%</div>
          <div style={LABEL_STYLE}>
            Would recommend Telezen to their family and friends
          </div>
        </div>
      </div>

      {/* Review quotes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          maxWidth: "1200px",
          margin: "40px auto 0",
        }}
      >
        {REVIEWS.map((review) => (
          <div
            key={review.author}
            style={{
              backgroundColor: "rgb(247,246,243)",
              borderRadius: "20px",
              padding: "28px",
            }}
          >
            <div style={{ color: "rgb(251,188,5)", fontSize: "16px" }}>
              ★★★★★
            </div>
            <p
              style={{
                fontSize: "15px",
                color: "rgba(29,29,31,0.8)",
                lineHeight: 1.6,
                margin: "16px 0",
              }}
            >
              {review.quote}
            </p>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "rgba(29,29,31,0.55)",
              }}
            >
              {review.author}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
