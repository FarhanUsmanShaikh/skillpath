import { useEffect, useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// Skillpath Courses
// Live course data + country-based pricing
// Bonus features: search, sorting, retry, skeleton loading, refundable badge

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

const API_BASE_URL = "https://syncsphere-hiv6.onrender.com"

type Course = {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

type CountryResponse = {
    country_code: "IN" | "US"
}

type Props = {
    accentColor: string
    cardRadius: number
}

type SortOption = "default" | "lowToHigh" | "highToLow"

export default function SkillpathCourses({ accentColor, cardRadius }: Props) {
    const [courses, setCourses] = useState<Course[]>([])
    const [country, setCountry] = useState<"IN" | "US" | null>(null)
    const [loading, setLoading] = useState(true)
    const [coursesError, setCoursesError] = useState(false)
    const [countryError, setCountryError] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [sortOption, setSortOption] = useState<SortOption>("default")

    const containerRef = useRef<HTMLDivElement>(null)
    const [columns, setColumns] = useState(1)

    /*
     * Responsive grid
     * Mobile: 1 column
     * Tablet: 2 columns
     * Desktop: 3 columns
     */
    useEffect(() => {
        if (typeof window === "undefined") return

        const element = containerRef.current
        if (!element || typeof ResizeObserver === "undefined") return

        const syncColumnsWithContainerWidth = (width: number) => {
            if (width < 560) {
                setColumns(1)
            } else if (width < 850) {
                setColumns(2)
            } else {
                setColumns(3)
            }
        }

        syncColumnsWithContainerWidth(element.getBoundingClientRect().width)

        const observer = new ResizeObserver(([entry]) => {
            syncColumnsWithContainerWidth(entry.contentRect.width)
        })

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    /*
     * Fetch both APIs independently.
     * Promise.allSettled allows course data to remain usable
     * when the country endpoint fails.
     */
    const loadData = async () => {
        setLoading(true)
        setCoursesError(false)
        setCountryError(false)

        const [coursesResult, countryResult] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/assignment/course-data`, {
                method: "GET",
            }),
            fetch(`${API_BASE_URL}/assignment/country-code`, {
                method: "GET",
            }),
        ])

        // Courses API
        if (coursesResult.status === "fulfilled" && coursesResult.value.ok) {
            try {
                const data = await coursesResult.value.json()

                if (Array.isArray(data)) {
                    setCourses(data)
                } else {
                    setCourses([])
                    setCoursesError(true)
                }
            } catch {
                setCourses([])
                setCoursesError(true)
            }
        } else {
            setCourses([])
            setCoursesError(true)
        }

        // Country API
        if (countryResult.status === "fulfilled" && countryResult.value.ok) {
            try {
                const data: CountryResponse = await countryResult.value.json()

                if (data.country_code === "IN" || data.country_code === "US") {
                    setCountry(data.country_code)
                } else {
                    setCountry(null)
                    setCountryError(true)
                }
            } catch {
                setCountry(null)
                setCountryError(true)
            }
        } else {
            setCountry(null)
            setCountryError(true)
        }

        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    /*
     * Format price according to the country endpoint.
     */
    const formattedCourses = useMemo(() => {
        return courses.map((course) => {
            let price: string | null = null
            let numericPrice: number | null = null

            if (country === "IN") {
                numericPrice = course.pricePaise / 100

                price = new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                }).format(numericPrice)
            }

            if (country === "US") {
                numericPrice = course.priceUsdCents / 100

                price = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(numericPrice)
            }

            return {
                ...course,
                price,
                numericPrice,
            }
        })
    }, [courses, country])

    /*
     * Search and sort operate entirely on fetched data.
     */
    const visibleCourses = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        let result = formattedCourses.filter((course) => {
            if (!query) return true

            return (
                course.courseName.toLowerCase().includes(query) ||
                course.description.toLowerCase().includes(query) ||
                course.mainCategory.toLowerCase().includes(query) ||
                course.shortCourse.toLowerCase().includes(query) ||
                course.courseType.toLowerCase().includes(query)
            )
        })

        if (sortOption === "lowToHigh") {
            result = [...result].sort((a, b) => {
                if (a.numericPrice === null) return 1
                if (b.numericPrice === null) return -1

                return a.numericPrice - b.numericPrice
            })
        }

        if (sortOption === "highToLow") {
            result = [...result].sort((a, b) => {
                if (a.numericPrice === null) return 1
                if (b.numericPrice === null) return -1

                return b.numericPrice - a.numericPrice
            })
        }

        return result
    }, [formattedCourses, searchQuery, sortOption])

    // Loading
    if (loading) {
        return (
            <section
                ref={containerRef}
                style={{
                    width: "100%",
                    padding: "48px 24px",
                    boxSizing: "border-box",
                    background: "#F8FAFC",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                }}
            >
                <SectionHeader />

                <div
                    style={{
                        width: "100%",
                        minWidth: 0,
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gap: 16,
                    }}
                >
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <SkeletonCard key={item} radius={cardRadius} />
                    ))}
                </div>
            </section>
        )
    }

    // Course API error
    if (coursesError) {
        return (
            <section
                ref={containerRef}
                style={{
                    width: "100%",
                    padding: "48px 24px",
                    boxSizing: "border-box",
                    background: "#F8FAFC",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                }}
            >
                <ErrorState onRetry={loadData} accentColor={accentColor} />
            </section>
        )
    }

    // Zero results from API
    if (courses.length === 0) {
        return (
            <section
                ref={containerRef}
                style={{
                    width: "100%",
                    padding: "48px 24px",
                    boxSizing: "border-box",
                    background: "#F8FAFC",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                }}
            >
                <EmptyState />
            </section>
        )
    }

    return (
        <section
            ref={containerRef}
            style={{
                width: "100%",
                padding: "48px 24px",
                boxSizing: "border-box",
                background: "#F8FAFC",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
            }}
        >
            <SectionHeader />

            {/* Country API warning */}
            {countryError && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: "#FFFFFF",
                        border: "1px solid #E4E7EC",
                        color: "#344054",
                        fontSize: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <span>
                        We couldn't determine your region, so course prices are
                        temporarily unavailable.
                    </span>

                    <button
                        onClick={loadData}
                        style={{
                            border: "1px solid #D0D5DD",
                            background: "#FFFFFF",
                            color: "#5F43D6",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            padding: "6px 10px",
                            borderRadius: 8,
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Search + sort */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 20,
                    width: "100%",
                    minWidth: 0,
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        flex: "1 1 260px",
                        minWidth: 0,
                    }}
                >
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search courses..."
                        aria-label="Search courses"
                        style={{
                            width: "100%",
                            height: 40,
                            padding: "0 12px",
                            boxSizing: "border-box",
                            borderRadius: 8,
                            border: "1px solid #D0D5DD",
                            background: "#FFFFFF",
                            color: "#0F172A",
                            outline: "none",
                            fontSize: 14,
                            lineHeight: 1.2,
                            fontFamily: "inherit",
                            boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
                        }}
                    />
                </div>

                <select
                    value={sortOption}
                    onChange={(event) =>
                        setSortOption(event.target.value as SortOption)
                    }
                    aria-label="Sort courses"
                    style={{
                        height: 40,
                        width: columns === 1 ? "100%" : undefined,
                        minWidth: columns === 1 ? 0 : 180,
                        padding: "0 32px 0 12px",
                        borderRadius: 8,
                        border: "1px solid #D0D5DD",
                        background: "#FFFFFF",
                        color: "#0F172A",
                        fontSize: 14,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        boxSizing: "border-box",
                        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
                    }}
                >
                    <option value="default">Sort: Default</option>
                    <option value="lowToHigh">Price: Low to high</option>
                    <option value="highToLow">Price: High to low</option>
                </select>
            </div>

            {/* Search result count */}
            {searchQuery.trim() && (
                <div
                    style={{
                        marginTop: -16,
                        marginBottom: 20,
                        color: "#475467",
                        fontSize: 13,
                    }}
                >
                    {visibleCourses.length}{" "}
                    {visibleCourses.length === 1 ? "course" : "courses"} found
                </div>
            )}

            {/* Search empty state */}
            {visibleCourses.length === 0 ? (
                <SearchEmptyState onClear={() => setSearchQuery("")} />
            ) : (
                <div
                    style={{
                        width: "100%",
                        minWidth: 0,
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gap: 16,
                    }}
                >
                    {visibleCourses.map((course) => (
                        <CourseCard
                            key={course.courseCode}
                            course={course}
                            accentColor={accentColor}
                            radius={cardRadius}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

// ----------------------------------------
// Section header
// ----------------------------------------

function SectionHeader() {
    return (
        <div
            style={{
                marginBottom: 28,
            }}
        >
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#6B7280",
                    marginBottom: 8,
                }}
            >
                Learn by doing
            </div>

            <h2
                style={{
                    margin: 0,
                    fontSize: "clamp(28px, 4vw, 42px)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                    color: "#0F172A",
                }}
            >
                Explore our courses
            </h2>

            <p
                style={{
                    margin: "12px 0 0",
                    maxWidth: 600,
                    color: "#475467",
                    fontSize: 16,
                    lineHeight: 1.6,
                }}
            >
                Practical courses designed to help you build useful skills and
                turn knowledge into action.
            </p>
        </div>
    )
}

// ----------------------------------------
// Course card
// ----------------------------------------

function CourseCard({
    course,
    accentColor,
    radius,
}: {
    course: Course & { price: string | null }
    accentColor: string
    radius: number
}) {
    return (
        <article
            style={{
                position: "relative",
                background: "#FFFFFF",
                border: "1px solid #E4E7EC",
                borderRadius: radius,
                padding: "clamp(16px, 2vw, 20px)",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
            }}
        >
            {/* Metadata */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 18,
                    minWidth: 0,
                    flexWrap: "wrap",
                }}
            >
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 8px",
                        borderRadius: 7,
                        background: "#F4F3FF",
                        border: "1px solid #E0DBFF",
                        color: "#5F43D6",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.01em",
                        maxWidth: "100%",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                    }}
                >
                    {course.courseType}
                </span>

                {course.refundable && (
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#166534",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: 999,
                            border: "1px solid #BBF7D0",
                            background: "#F0FDF4",
                            maxWidth: "100%",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                        }}
                    >
                        ✓ Refundable
                    </span>
                )}
            </div>

            {/* Course title */}
            <h3
                style={{
                    margin: 0,
                    color: "#0F172A",
                    fontSize: "clamp(18px, 1.8vw, 21px)",
                    lineHeight: 1.25,
                    letterSpacing: "-0.025em",
                    fontWeight: 700,
                    minWidth: 0,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                }}
            >
                {course.courseName}
            </h3>

            {/* Description */}
            <p
                style={{
                    margin: "10px 0 0",
                    color: "#475467",
                    fontSize: 14,
                    lineHeight: 1.55,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minWidth: 0,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                }}
            >
                {course.description}
            </p>

            {/* Course metadata */}
            <div
                style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid #EAECF0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    minWidth: 0,
                }}
            >
                {/* Category */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            color: "#98A2B3",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            flexShrink: 0,
                        }}
                    >
                        Category
                    </span>

                    <span
                        style={{
                            color: "#344054",
                            fontSize: 13,
                            fontWeight: 600,
                            textAlign: "right",
                            minWidth: 0,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                        }}
                        title={course.mainCategory}
                    >
                        {course.mainCategory}
                    </span>
                </div>

                {/* Course / price */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: 10,
                        minWidth: 0,
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            minWidth: 0,
                            flex: "1 1 auto",
                        }}
                    >
                        <div
                            style={{
                                color: "#98A2B3",
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: 4,
                            }}
                        >
                            Course
                        </div>

                        <div
                            style={{
                                color: "#475467",
                                fontSize: 13,
                                fontWeight: 600,
                                minWidth: 0,
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                            }}
                            title={course.shortCourse}
                        >
                            {course.shortCourse}
                        </div>
                    </div>

                    <div
                        style={{
                            color: "#0F172A",
                            fontSize: "clamp(18px, 2.4vw, 22px)",
                            lineHeight: 1.1,
                            fontWeight: 750,
                            letterSpacing: "-0.02em",
                            textAlign: "right",
                            flex: "1 1 140px",
                            minWidth: 0,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                        }}
                    >
                        {course.price ?? "Price unavailable"}
                    </div>
                </div>
            </div>
        </article>
    )
}

// ----------------------------------------
// Skeleton loader
// ----------------------------------------

function SkeletonCard({ radius }: { radius: number }) {
    return (
        <div
            style={{
                height: 260,
                borderRadius: radius,
                background:
                    "linear-gradient(90deg, #F8FAFC 25%, #EEF2F6 50%, #F8FAFC 75%)",
                backgroundSize: "200% 100%",
                border: "1px solid #E4E7EC",
            }}
        />
    )
}

// ----------------------------------------
// Empty API state
// ----------------------------------------

function EmptyState() {
    return (
        <div
            style={{
                textAlign: "center",
                padding: "56px 24px",
                border: "1px solid #E4E7EC",
                borderRadius: 12,
                background: "#FFFFFF",
            }}
        >
            <h3
                style={{
                    margin: 0,
                    color: "#0F172A",
                    fontSize: 21,
                }}
            >
                No courses available
            </h3>

            <p
                style={{
                    margin: "10px auto 0",
                    maxWidth: 420,
                    color: "#475467",
                    lineHeight: 1.6,
                }}
            >
                There aren't any courses available right now. Please check back
                again soon.
            </p>
        </div>
    )
}

// ----------------------------------------
// Search empty state
// ----------------------------------------

function SearchEmptyState({ onClear }: { onClear: () => void }) {
    return (
        <div
            style={{
                textAlign: "center",
                padding: "52px 24px",
                border: "1px solid #E4E7EC",
                borderRadius: 12,
                background: "#FFFFFF",
            }}
        >
            <h3
                style={{
                    margin: 0,
                    color: "#0F172A",
                    fontSize: 20,
                }}
            >
                No matching courses
            </h3>

            <p
                style={{
                    margin: "10px auto 20px",
                    maxWidth: 420,
                    color: "#475467",
                    lineHeight: 1.6,
                    fontSize: 14,
                }}
            >
                Try a different search term or clear your search to see all
                available courses.
            </p>

            <button
                onClick={onClear}
                style={{
                    border: "1px solid #D6CCFF",
                    borderRadius: 8,
                    padding: "10px 16px",
                    background: "#5F43D6",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.08)",
                }}
            >
                Clear search
            </button>
        </div>
    )
}

// ----------------------------------------
// Error state
// ----------------------------------------

function ErrorState({
    onRetry,
    accentColor,
}: {
    onRetry: () => void
    accentColor: string
}) {
    return (
        <div
            style={{
                textAlign: "center",
                padding: "56px 24px",
                border: "1px solid #E4E7EC",
                borderRadius: 12,
                background: "#FFFFFF",
            }}
        >
            <h3
                style={{
                    margin: 0,
                    color: "#0F172A",
                    fontSize: 21,
                }}
            >
                We couldn't load the courses
            </h3>

            <p
                style={{
                    margin: "10px auto 24px",
                    maxWidth: 420,
                    color: "#475467",
                    lineHeight: 1.6,
                }}
            >
                Something went wrong while loading the latest courses. Please
                try again.
            </p>

            <button
                onClick={onRetry}
                style={{
                    border: "1px solid #D6CCFF",
                    borderRadius: 8,
                    padding: "10px 16px",
                    background: accentColor,
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.08)",
                }}
            >
                Try again
            </button>
        </div>
    )
}

// ----------------------------------------
// Framer property controls
// ----------------------------------------

addPropertyControls(SkillpathCourses, {
    accentColor: {
        title: "Accent Color",
        type: ControlType.Color,
        defaultValue: "#635BFF",
    },

    cardRadius: {
        title: "Card Radius",
        type: ControlType.Number,
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
})
