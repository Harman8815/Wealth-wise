"""
Feature engineering for transaction text classification.
Combines TF-IDF on merchant + description with numeric features.
"""
import logging
from typing import Dict, List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)


class TextFeaturizer:
    """Fit a TF-IDF vectorizer and transform transaction text into features."""

    def __init__(self, max_features: int = 5000, ngram_range: Tuple[int, int] = (1, 2)):
        self.max_features = max_features
        self.ngram_range = ngram_range
        self.vectorizer: TfidfVectorizer = None
        self.labels: List[str] = []

    def fit(self, texts: List[str], labels: List[str]) -> 'TextFeaturizer':
        self.vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            ngram_range=self.ngram_range,
            stop_words='english',
            sublinear_tf=True,
        )
        self.vectorizer.fit(texts)
        self.labels = sorted(set(labels))
        return self

    def transform(self, texts: List[str]):
        if self.vectorizer is None:
            raise RuntimeError("Featurizer is not fitted.")
        return self.vectorizer.transform(texts)

    def build_corpus(self, records: List[Dict]) -> List[str]:
        texts = []
        for rec in records:
            merchant = (rec.get('merchant') or '').strip()
            description = (rec.get('description') or '').strip()
            amount = rec.get('amount', 0)
            txn_type = (rec.get('transaction_type') or 'expense').strip()
            texts.append(f"{merchant} {description} {txn_type} amount_{float(amount):.2f}")
        return texts
