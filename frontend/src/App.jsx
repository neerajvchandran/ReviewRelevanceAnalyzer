import React, { useState, useRef } from 'react';

function App() {
  const [productDesc, setProductDesc] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [features, setFeatures] = useState([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);

  const [review, setReview] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const descRef = useRef(null);

  const handleDescChange = (e) => {
    if (isLocked) return;
    const value = e.target.value;
    setProductDesc(value);
    
    // Detect double enter (two consecutive newlines at the end)
    if (value.endsWith('\n\n')) {
      lockAndExtractFeatures(value);
    }
  };

  const lockAndExtractFeatures = async (text) => {
    setIsLocked(true);
    setIsLoadingFeatures(true);
    try {
      const res = await fetch('http://localhost:5000/extract_features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_description: text.trim() })
      });
      const data = await res.json();
      setFeatures(data.features || []);
    } catch (e) {
      console.error(e);
      setFeatures(["Network Error", "Check Backend"]);
    } finally {
      setIsLoadingFeatures(false);
    }
  };

  const handleAnalyze = async () => {
    if (!review.trim() || !isLocked) return;
    setIsAnalyzing(true);
    setAnalysisResult(null); // Reset
    try {
      const res = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_description: productDesc.trim(), 
          review: review.trim(),
          features: features 
        })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const unlockProduct = () => {
    setIsLocked(false);
    setFeatures([]);
    setAnalysisResult(null);
    setProductDesc(productDesc.replace(/\n\n$/, '')); // remove the double enter
    setTimeout(() => { descRef.current?.focus(); }, 50);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <header className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent pb-1">
          Review Relevance AI
        </h1>
        <p className="text-gray-400 text-lg">Analyze customer reviews against specific product descriptions using semantic AI.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-8">
          
          {/* Product Description Section */}
          <section className="bg-surface/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm ring-1 ring-primary/30">1</span>
                Product Description
              </h2>
              {isLocked && (
                <span className="text-success text-sm font-medium animate-pulse flex items-center gap-1.5 bg-success/10 px-3 py-1 rounded-full border border-success/20">
                  Product Loaded 
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </span>
              )}
            </div>
            
            <div className="relative group">
              <textarea
                ref={descRef}
                value={productDesc}
                onChange={handleDescChange}
                disabled={isLocked}
                placeholder="Paste product description (press ENTER twice to finalize)"
                className={`w-full h-36 bg-background/50 border ${isLocked ? 'border-success/40 text-gray-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/10 group-focus-within:border-primary/50'} rounded-xl p-5 resize-none transition-all outline-none text-gray-200 font-medium leading-relaxed custom-scrollbar`}
              />
              
              {isLocked && (
                <button 
                  onClick={unlockProduct}
                  className="absolute top-4 right-4 bg-background hover:bg-surface text-gray-400 p-2 rounded-lg backdrop-blur-sm transition-colors text-xs border border-white/10 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Edit
                </button>
              )}
            </div>

            {/* Features Panel */}
            {(isLoadingFeatures || features.length > 0) && (
              <div className="mt-6 animate-fade-in border-t border-white/5 pt-6 relative">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                  NLP Extracted Features
                </h3>
                {isLoadingFeatures ? (
                  <div className="flex items-center gap-3 text-accent text-sm font-medium bg-accent/10 w-max px-4 py-2 rounded-lg">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    Parsing embeddings...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {features.map((f, i) => (
                      <span key={i} className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5 cursor-default">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"></span>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Review Input Section */}
          <section className={`bg-surface/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 transition-all duration-500 shadow-xl ${isLocked ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none translate-y-4'}`}>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm ring-1 ring-accent/30">2</span>
              Customer Review
            </h2>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Enter user review..."
              className="w-full h-32 bg-background/50 border border-white/10 focus:border-accent/50 rounded-xl p-5 resize-none transition-all outline-none text-gray-200 leading-relaxed custom-scrollbar"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !review.trim()}
              className="mt-5 w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:hover:from-primary disabled:hover:to-accent overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isAnalyzing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Running Semantic Analysis
                   </>
                ) : (
                  <>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                     Analyze Correlation
                  </>
                )}
              </span>
            </button>
          </section>

        </div>

        {/* Right Column: Output Card */}
        <div className="h-full">
          {analysisResult ? (
            <section className="bg-surface/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl animate-fade-in h-full flex flex-col relative overflow-hidden group">
              {/* Background gradient blob */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none transition-all duration-1000 group-hover:bg-accent/20"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                  Results
                </h2>
                
                {/* Classification Badge */}
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-md flex items-center gap-2 ${
                  analysisResult.classification.includes('Positive') ? 'bg-success/10 text-success border-success/20' : 
                  analysisResult.classification.includes('Negative') ? 'bg-danger/10 text-danger border-danger/20' : 
                  analysisResult.classification.includes('Neutral') ? 'bg-warning/10 text-warning border-warning/20' : 
                  'bg-gray-800 text-gray-400 border-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    analysisResult.classification.includes('Pos') ? 'bg-success' : 
                    analysisResult.classification.includes('Neg') ? 'bg-danger' : 
                    analysisResult.classification.includes('Neu') ? 'bg-warning' : 'bg-gray-400'
                  } animate-pulse`}></div>
                  {analysisResult.classification.toUpperCase()}
                </div>
              </div>

              <div className="space-y-8 relative z-10 flex-grow">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-5 py-2">
                  <div className="bg-background/80 p-5 rounded-2xl border border-white/5 relative overflow-hidden group/metric">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex justify-between items-end mb-3 relative z-10">
                      <span className="text-sm text-gray-400 font-medium">Relevance Score</span>
                      <span className="text-3xl font-black text-white">{analysisResult.relevance_score}<span className="text-base text-gray-500 font-medium">%</span></span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5 shadow-inner">
                      <div className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" style={{width: `${analysisResult.relevance_score}%`}}></div>
                    </div>
                  </div>

                  <div className="bg-background/80 p-5 rounded-2xl border border-white/5 relative overflow-hidden group/metric">
                    <div className="absolute inset-0 bg-gradient-to-bl from-success/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex justify-between items-end mb-3 relative z-10">
                      <span className="text-sm text-gray-400 font-medium whitespace-nowrap">Feature Corverage</span>
                      <span className="text-3xl font-black text-white">{analysisResult.feature_coverage}<span className="text-base text-gray-500 font-medium">%</span></span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5 shadow-inner">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-2.5 rounded-full filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out delay-300" style={{width: `${analysisResult.feature_coverage}%`}}></div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-background/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                  <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Explanation
                  </h3>
                  <p className="text-base leading-relaxed text-gray-200">
                    {analysisResult.explanation}
                  </p>
                </div>

                {/* Feature Matching */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                    Matching Breakdown
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {analysisResult.matched_features.map((f, i) => (
                      <span key={`matched-${i}`} className="px-3.5 py-1.5 bg-success/10 border border-success/30 text-success rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transform hover:-translate-y-0.5 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        {f}
                      </span>
                    ))}
                    {analysisResult.unmatched_features.map((f, i) => (
                      <span key={`unmatched-${i}`} className="px-3.5 py-1.5 bg-gray-800/80 border border-gray-700 text-gray-500 rounded-lg text-sm font-medium flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        <span className="line-through decoration-gray-600 border-none">{f}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : (
             <div className="h-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-10 text-center opacity-40 bg-surface/10">
               <div className="w-20 h-20 bg-background rounded-full mb-6 flex items-center justify-center shadow-inner border border-white/5">
                 <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               </div>
               <h3 className="text-2xl font-bold mb-3 text-gray-300">Awaiting Submissions</h3>
               <p className="text-base text-gray-500 max-w-sm leading-relaxed">System ready. Load a product description and submit a customer review to compute semantic relevance metrics.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
